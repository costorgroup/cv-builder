import { createReadStream } from 'node:fs';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import type { Readable } from 'node:stream';
import { isSafeKey, type StorageProvider } from './storage-provider.js';

/**
 * Files on this server's disk, under `STORAGE_DIR` (default `./storage`).
 * The platform storage in development; production needs shared storage
 * (an S3-compatible bucket) once there's more than one API instance.
 */
export class LocalStorageProvider implements StorageProvider {
  private readonly root = resolve(process.env.STORAGE_DIR ?? 'storage');

  private path(key: string) {
    if (!isSafeKey(key)) throw new Error(`Unsafe storage key: ${key}`);
    const path = resolve(join(this.root, key));
    if (!path.startsWith(this.root + sep)) {
      throw new Error(`Storage key outside the storage folder: ${key}`);
    }
    return path;
  }

  async put(key: string, body: Buffer) {
    const path = this.path(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
  }

  async get(key: string): Promise<Readable | null> {
    const path = this.path(key);
    try {
      await stat(path);
    } catch {
      return null;
    }
    return createReadStream(path);
  }

  async delete(key: string) {
    await rm(this.path(key), { force: true });
  }

  async deletePrefix(prefix: string) {
    const path = resolve(join(this.root, prefix));
    if (
      !/^org\/[0-9a-f-]{36}\/?$/i.test(prefix) ||
      !path.startsWith(this.root + sep)
    ) {
      throw new Error(`Unsafe storage prefix: ${prefix}`);
    }
    await rm(path, { recursive: true, force: true });
  }
}
