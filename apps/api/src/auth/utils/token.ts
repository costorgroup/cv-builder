import { createHash, randomBytes } from 'node:crypto';

/**
 * An unguessable token. 32 bytes for long-lived refresh tokens; emailed link
 * tokens are single-use and expire, so 16 (128 bits) keeps their URLs short.
 */
export const createToken = (bytes = 32) =>
  randomBytes(bytes).toString('base64url');

/** Tokens are stored hashed, so a leaked database can't be used to sign in. */
export const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');
