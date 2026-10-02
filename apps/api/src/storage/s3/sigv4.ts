import { createHash, createHmac } from 'node:crypto';

/** SHA-256 of an empty body, which most S3 reads send. */
export const EMPTY_SHA256 =
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

export const sha256Hex = (body: string | Buffer) =>
  createHash('sha256').update(body).digest('hex');

const hmac = (key: string | Buffer, value: string) =>
  createHmac('sha256', key).update(value).digest();

/** RFC 3986 encoding, as SigV4 wants it; paths are encoded per segment. */
const encode = (value: string) =>
  encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );

/** "20130524T000000Z" and "20130524" for a moment. */
export const amzDates = (date: Date) => {
  const amzDate = date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
  return { amzDate, day: amzDate.slice(0, 8) };
};

export type TSignInput = {
  method: string;
  url: URL;
  /** Every header to sign, including host and the x-amz-* ones. */
  headers: Record<string, string>;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Moment of signing; must match the x-amz-date header. */
  date: Date;
  service?: string;
};

/**
 * The Authorization header for an AWS Signature Version 4 request. The
 * body's hash is taken from the x-amz-content-sha256 header.
 */
export const signRequest = ({
  method,
  url,
  headers,
  region,
  accessKeyId,
  secretAccessKey,
  date,
  service = 's3',
}: TSignInput) => {
  const { amzDate, day } = amzDates(date);
  const canonicalHeaders = Object.entries(headers)
    .map(([name, value]) => [
      name.toLowerCase(),
      value.trim().replace(/\s+/g, ' '),
    ])
    .sort(([a], [b]) => (a! < b! ? -1 : 1));
  const signedHeaders = canonicalHeaders.map(([name]) => name).join(';');
  const query = [...url.searchParams.entries()]
    .map(([key, value]) => [encode(key), encode(value)])
    .sort(([a, x], [b, y]) => (a! < b! ? -1 : a! > b! ? 1 : x! < y! ? -1 : 1))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  const path = url.pathname
    .split('/')
    .map((segment) => encode(decodeURIComponent(segment)))
    .join('/');

  const canonicalRequest = [
    method,
    path || '/',
    query,
    canonicalHeaders.map(([name, value]) => `${name}:${value}\n`).join(''),
    signedHeaders,
    headers['x-amz-content-sha256'] ?? EMPTY_SHA256,
  ].join('\n');

  const scope = `${day}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join('\n');
  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${secretAccessKey}`, day), region), service),
    'aws4_request',
  );
  const signature = createHmac('sha256', signingKey)
    .update(stringToSign)
    .digest('hex');

  return `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
};
