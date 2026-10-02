import { Readable } from 'node:stream';
import { assertPublicHost } from '../network-guard.js';
import type { StorageProvider } from '../storage-provider.js';
import { amzDates, EMPTY_SHA256, sha256Hex, signRequest } from './sigv4.js';

/** Where an S3-compatible bucket is, and which part of it is ours. */
export type TS3Settings = {
  bucket: string;
  region: string;
  /**
   * For S3-compatible services (e.g. Cloudflare R2, MinIO, DigitalOcean
   * Spaces): their address, used with path-style URLs. AWS itself when
   * left out.
   */
  endpoint?: string;
  /** A folder in the bucket to keep everything under, e.g. "cv-builder/". */
  prefix?: string;
};

export type TS3Credentials = {
  accessKeyId: string;
  secretAccessKey: string;
};

/** A request to S3 that didn't work, with what S3 said. */
export class S3Error extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const xmlValue = (xml: string, tag: string) =>
  new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(xml)?.[1];

/**
 * An S3-compatible bucket, over plain HTTPS with Signature V4 (no SDK).
 * Keys are kept under the configured prefix.
 */
export class S3StorageProvider implements StorageProvider {
  /** The custom endpoint's host, once checked not to be ours. */
  private hostChecked?: Promise<void>;

  constructor(
    private readonly settings: TS3Settings,
    private readonly credentials: TS3Credentials,
    /**
     * Our own bucket, configured by us: its endpoint may be on a private
     * network. Customers' endpoints are always checked.
     */
    private readonly trustedEndpoint = false,
  ) {}

  private url(key: string, query: Record<string, string> = {}) {
    const { bucket, region, endpoint } = this.settings;
    const path = key
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    const url = endpoint
      ? new URL(`${endpoint.replace(/\/+$/, '')}/${bucket}/${path}`)
      : new URL(`https://${bucket}.s3.${region}.amazonaws.com/${path}`);
    for (const [name, value] of Object.entries(query)) {
      url.searchParams.set(name, value);
    }
    return url;
  }

  private key(key: string) {
    const prefix = (this.settings.prefix ?? '').replace(/^\/+/, '');
    return `${prefix}${key}`;
  }

  private async send(
    method: 'GET' | 'PUT' | 'DELETE',
    url: URL,
    body?: Buffer,
    extraHeaders: Record<string, string> = {},
  ) {
    // A customer's endpoint is checked where it resolves now, not only as
    // it was typed (AWS's own hosts need no check).
    if (this.settings.endpoint && !this.trustedEndpoint) {
      this.hostChecked ??= assertPublicHost(url.hostname).catch(
        (error: unknown) => {
          throw new S3Error(
            0,
            'BlockedEndpoint',
            error instanceof Error ? error.message : 'Endpoint not allowed',
          );
        },
      );
      await this.hostChecked;
    }
    const date = new Date();
    const headers: Record<string, string> = {
      host: url.host,
      'x-amz-content-sha256': body ? sha256Hex(body) : EMPTY_SHA256,
      'x-amz-date': amzDates(date).amzDate,
      ...extraHeaders,
    };
    headers.authorization = signRequest({
      method,
      url,
      headers,
      region: this.settings.region,
      date,
      ...this.credentials,
    });
    const { host: _host, ...sent } = headers;
    const response = await fetch(url, {
      method,
      headers: sent,
      ...(body && { body: new Uint8Array(body) }),
    });
    return response;
  }

  private async fail(response: Response, action: string): Promise<never> {
    const text = await response.text().catch(() => '');
    const code = xmlValue(text, 'Code') ?? `HTTP${response.status}`;
    throw new S3Error(
      response.status,
      code,
      `${action}: ${xmlValue(text, 'Message') ?? code}`,
    );
  }

  async put(key: string, body: Buffer, contentType: string) {
    const response = await this.send('PUT', this.url(this.key(key)), body, {
      'content-type': contentType,
    });
    if (!response.ok) await this.fail(response, 'Upload failed');
  }

  async get(key: string): Promise<Readable | null> {
    const response = await this.send('GET', this.url(this.key(key)));
    if (response.status === 404) return null;
    if (!response.ok || !response.body)
      await this.fail(response, 'Read failed');
    return Readable.fromWeb(response.body as never);
  }

  async delete(key: string) {
    const response = await this.send('DELETE', this.url(this.key(key)));
    if (!response.ok && response.status !== 404) {
      await this.fail(response, 'Delete failed');
    }
  }

  async deletePrefix(prefix: string) {
    let token: string | undefined;
    do {
      const response = await this.send(
        'GET',
        this.url('', {
          'list-type': '2',
          prefix: this.key(prefix),
          ...(token && { 'continuation-token': token }),
        }),
      );
      if (!response.ok) await this.fail(response, 'Listing failed');
      const xml = await response.text();
      const keys = [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map(
        ([, value]) => value!,
      );
      for (const key of keys) {
        const removed = await this.send('DELETE', this.url(key));
        if (!removed.ok && removed.status !== 404) {
          await this.fail(removed, 'Delete failed');
        }
      }
      token =
        xmlValue(xml, 'IsTruncated') === 'true'
          ? xmlValue(xml, 'NextContinuationToken')
          : undefined;
    } while (token);
  }

  /**
   * Proves the bucket works with these credentials: writes a small file,
   * reads it back and deletes it. Throws an S3Error saying what failed.
   */
  async verify(organizationId: string) {
    const key = `org/${organizationId}/.cv-builder-check`;
    const body = Buffer.from(`CV Builder storage check ${Date.now()}`);
    await this.put(key, body, 'text/plain');
    const stream = await this.get(key);
    const chunks: Buffer[] = [];
    if (stream)
      for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    if (!Buffer.concat(chunks).equals(body)) {
      throw new S3Error(
        0,
        'ReadBackMismatch',
        'The file read back was different.',
      );
    }
    await this.delete(key);
  }
}
