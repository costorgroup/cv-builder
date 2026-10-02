import type { Readable } from 'node:stream';

/**
 * Where files are kept. Keys are always under `org/{organizationId}/`, so
 * one organization's files can be listed or removed together.
 */
export interface StorageProvider {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  /** The file, or null if it isn't there. */
  get(key: string): Promise<Readable | null>;
  delete(key: string): Promise<void>;
  /** Every file under `prefix`, e.g. an organization's on its deletion. */
  deletePrefix(prefix: string): Promise<void>;
}

/** A key that can't climb out of its folder or name another tenant's. */
export const isSafeKey = (key: string) =>
  /^org\/[0-9a-f-]{36}\/[a-z0-9/_.-]+$/i.test(key) && !key.includes('..');
