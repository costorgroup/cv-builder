import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keyLength: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

/** Hashes a password as `<salt>:<hash>` (hex, scrypt). */
export const hashPassword = async (password: string) => {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
};

export const verifyPassword = async (password: string, stored: string) => {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = await scryptAsync(
    password,
    Buffer.from(salt, 'hex'),
    expected.length,
  );
  return timingSafeEqual(actual, expected);
};

/**
 * Checked against when no user matches the email, so a sign-in takes as
 * long whether or not the account exists.
 */
export const DUMMY_PASSWORD_HASH = `${'0'.repeat(32)}:${'0'.repeat(KEY_LENGTH * 2)}`;
