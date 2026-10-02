import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { decryptSecret, encryptSecret } from './credentials-cipher.js';
import { S3Error, S3StorageProvider } from './s3/s3-storage.provider.js';
import { assertPublicHost } from './network-guard.js';
import { parseStorageSettings } from './storage-configs.service.js';

const ORG = '11111111-1111-1111-1111-111111111111';

describe('credentials cipher', () => {
  beforeAll(() => {
    process.env.STORAGE_ENCRYPTION_KEY = randomBytes(32).toString('base64');
  });

  it('round-trips, and differs every time', () => {
    const value = { accessKeyId: 'AKIA…', secretAccessKey: 's3cr3t' };
    const one = encryptSecret(value);
    expect(Buffer.from(one).toString('utf8')).not.toContain('s3cr3t');
    expect(Buffer.from(one).equals(Buffer.from(encryptSecret(value)))).toBe(
      false,
    );
    expect(decryptSecret(one)).toEqual(value);
  });

  it('refuses tampered data', () => {
    const stored = encryptSecret({ secret: 'x' });
    stored[stored.length - 1] ^= 1;
    expect(() => decryptSecret(stored)).toThrow();
  });
});

describe('parseStorageSettings', () => {
  it('refuses endpoints inside our own network', () => {
    for (const endpoint of [
      'https://10.0.0.5',
      'https://192.168.1.1',
      'https://169.254.169.254',
      'https://[fd00::1]',
      'https://metadata.internal',
    ]) {
      expect(() =>
        parseStorageSettings({ bucket: 'acme', region: 'auto', endpoint }),
      ).toThrow(BadRequestException);
    }
  });

  it('allows localhost only outside production', () => {
    const input = {
      bucket: 'acme',
      region: 'auto',
      endpoint: 'http://localhost:9000',
    };
    expect(parseStorageSettings(input).endpoint).toBe('http://localhost:9000');
    const before = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      expect(() => parseStorageSettings(input)).toThrow(BadRequestException);
    } finally {
      process.env.NODE_ENV = before;
    }
  });

  it('cleans a valid bucket', () => {
    expect(
      parseStorageSettings({
        bucket: 'acme-cvs',
        region: 'eu-central-1',
        endpoint: 'https://abc.r2.cloudflarestorage.com/',
        prefix: '/cv-builder',
      }),
    ).toEqual({
      bucket: 'acme-cvs',
      region: 'eu-central-1',
      endpoint: 'https://abc.r2.cloudflarestorage.com',
      prefix: 'cv-builder/',
    });
  });

  it('names every problem', () => {
    expect(() =>
      parseStorageSettings({
        bucket: 'Bad_Bucket',
        region: 'EU',
        endpoint: 'http://example.com',
        prefix: '../up',
      }),
    ).toThrow(BadRequestException);
  });
});

/** Just enough of S3 to store, list and delete objects, path-style. */
const fakeS3 = () => {
  const objects = new Map<string, Buffer>();
  const seen: string[] = [];
  const server = createServer((request, response) => {
    seen.push(request.headers.authorization ?? '');
    const url = new URL(request.url ?? '/', 'http://localhost');
    const [, bucket, ...rest] = url.pathname.split('/');
    const key = decodeURIComponent(rest.join('/'));
    if (
      bucket !== 'acme' ||
      !request.headers.authorization?.includes('Credential=KEY/')
    ) {
      response.statusCode = 403;
      response.end(
        '<Error><Code>AccessDenied</Code><Message>Access Denied</Message></Error>',
      );
      return;
    }
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => {
      if (request.method === 'PUT') objects.set(key, Buffer.concat(chunks));
      if (request.method === 'DELETE') objects.delete(key);
      if (
        request.method === 'GET' &&
        url.searchParams.get('list-type') === '2'
      ) {
        // Two at a time, to make the client page through.
        const all = [...objects.keys()].filter((each) =>
          each.startsWith(url.searchParams.get('prefix') ?? ''),
        );
        const page = all.slice(0, 2);
        response.end(
          `<ListBucketResult>${page.map((each) => `<Contents><Key>${each}</Key></Contents>`).join('')}<IsTruncated>${all.length > 2}</IsTruncated>${all.length > 2 ? '<NextContinuationToken>more</NextContinuationToken>' : ''}</ListBucketResult>`,
        );
        return;
      }
      if (request.method === 'GET') {
        const body = objects.get(key);
        response.statusCode = body ? 200 : 404;
        response.end(body ?? '<Error><Code>NoSuchKey</Code></Error>');
        return;
      }
      response.statusCode = request.method === 'DELETE' ? 204 : 200;
      response.end();
    });
  });
  return { server, objects, seen };
};

describe('assertPublicHost', () => {
  it('refuses names that resolve inside our network', async () => {
    await expect(assertPublicHost('10.1.2.3')).rejects.toThrow(/private/);
    await expect(assertPublicHost('[fd00::1]')).rejects.toThrow(/private/);
  });

  it('lets public addresses through', async () => {
    await expect(assertPublicHost('1.1.1.1')).resolves.toBeUndefined();
  });

  it('refuses localhost in production', async () => {
    const before = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      await expect(assertPublicHost('localhost')).rejects.toThrow(/private/);
    } finally {
      process.env.NODE_ENV = before;
    }
  });
});

describe('S3StorageProvider (against a fake S3)', () => {
  let fake: ReturnType<typeof fakeS3>;
  let endpoint: string;
  const provider = (bucket = 'acme') =>
    new S3StorageProvider(
      { bucket, region: 'auto', endpoint, prefix: 'cvb/' },
      { accessKeyId: 'KEY', secretAccessKey: 'SECRET' },
    );

  beforeAll(async () => {
    fake = fakeS3();
    await new Promise<void>((resolve) => fake.server.listen(0, resolve));
    endpoint = `http://localhost:${(fake.server.address() as AddressInfo).port}`;
  });
  afterAll(
    () => new Promise((resolve) => (fake.server as Server).close(resolve)),
  );

  it('passes the check: write, read back, delete', async () => {
    await provider().verify(ORG);
    expect(fake.objects.size).toBe(0);
    expect(
      fake.seen.every((each) => each.startsWith('AWS4-HMAC-SHA256 ')),
    ).toBe(true);
  });

  it('keeps files under the folder, and reads them back', async () => {
    await provider().put(
      `org/${ORG}/assets/a`,
      Buffer.from('photo'),
      'image/jpeg',
    );
    expect([...fake.objects.keys()]).toEqual([`cvb/org/${ORG}/assets/a`]);
    const chunks: Buffer[] = [];
    for await (const chunk of (await provider().get(`org/${ORG}/assets/a`))!) {
      chunks.push(Buffer.from(chunk));
    }
    expect(Buffer.concat(chunks).toString()).toBe('photo');
    expect(await provider().get(`org/${ORG}/assets/missing`)).toBeNull();
  });

  it('deletes everything under a prefix, page by page', async () => {
    for (const name of ['b', 'c', 'd', 'e']) {
      await provider().put(
        `org/${ORG}/assets/${name}`,
        Buffer.from(name),
        'image/jpeg',
      );
    }
    await provider().deletePrefix(`org/${ORG}/`);
    expect(fake.objects.size).toBe(0);
  });

  it('says what S3 refused', async () => {
    const error = await provider('someone-elses')
      .verify(ORG)
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(S3Error);
    expect((error as S3Error).code).toBe('AccessDenied');
  });
});
