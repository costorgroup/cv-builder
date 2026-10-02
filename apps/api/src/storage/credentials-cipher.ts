import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Encrypts customers' storage credentials at rest (AES-256-GCM), with the
 * 32-byte key in STORAGE_ENCRYPTION_KEY (base64). Stored as iv + tag +
 * ciphertext; a changed or wrong key fails to decrypt rather than misread.
 */
const key = () => {
  const encoded = process.env.STORAGE_ENCRYPTION_KEY;
  const bytes = encoded ? Buffer.from(encoded, 'base64') : Buffer.alloc(0);
  if (bytes.length !== 32) {
    throw new Error('STORAGE_ENCRYPTION_KEY must be 32 bytes, base64-encoded');
  }
  return bytes;
};

export const encryptSecret = (value: unknown): Uint8Array<ArrayBuffer> => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), 'utf8'),
    cipher.final(),
  ]);
  return new Uint8Array(Buffer.concat([iv, cipher.getAuthTag(), encrypted]));
};

export const decryptSecret = <T>(stored: Uint8Array): T => {
  const bytes = Buffer.from(stored);
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key(),
    bytes.subarray(0, 12),
  );
  decipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([
      decipher.update(bytes.subarray(28)),
      decipher.final(),
    ]).toString('utf8'),
  ) as T;
};
