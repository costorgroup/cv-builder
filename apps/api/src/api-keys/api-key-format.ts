import { randomBytes } from 'node:crypto';
import { API_KEY_PREFIX } from '@repo/cv-core';
import { createToken, hashToken } from '../auth/utils/token.js';

/** "cvb_live_" + 8 hex characters + "_" + a 256-bit secret. */
const KEY_PATTERN = /^cvb_live_([0-9a-f]{8})_([A-Za-z0-9_-]{43})$/;

/** A new key, and what's stored of it (its prefix and hash, never itself). */
export const generateApiKey = () => {
  const prefix = randomBytes(4).toString('hex');
  const key = `${API_KEY_PREFIX}${prefix}_${createToken(32)}`;
  return { key, prefix, secretHash: hashToken(key) };
};

/** The hash to look a presented key up by; null if it isn't shaped like one. */
export const apiKeyHashOf = (presented: string) =>
  KEY_PATTERN.test(presented) ? hashToken(presented) : null;

/** What a key is shown as once made, e.g. "cvb_live_a1b2c3d4". */
export const apiKeyPreview = (prefix: string) => `${API_KEY_PREFIX}${prefix}`;

/** The key from an `Authorization: Bearer …` header, if there is one. */
export const bearerTokenOf = (header: string | string[] | undefined) => {
  const value = Array.isArray(header) ? header[0] : header;
  const match = /^Bearer\s+(\S+)$/i.exec(value ?? '');
  return match?.[1];
};
