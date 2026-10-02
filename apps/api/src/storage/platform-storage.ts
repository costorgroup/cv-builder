import { Logger } from '@nestjs/common';
import { LocalStorageProvider } from './local-storage.provider.js';
import { S3StorageProvider } from './s3/s3-storage.provider.js';
import type { StorageProvider } from './storage-provider.js';

const required = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required when PLATFORM_STORAGE=s3`);
  return value;
};

/**
 * Where we keep files: this server's disk by default (STORAGE_DIR), or with
 * PLATFORM_STORAGE=s3 an S3-compatible bucket, which every API instance
 * shares; needed once there's more than one.
 */
export const createPlatformStorage = (): StorageProvider => {
  if (process.env.PLATFORM_STORAGE !== 's3') return new LocalStorageProvider();
  const bucket = required('PLATFORM_S3_BUCKET');
  new Logger('Storage').log(`Keeping files in bucket ${bucket}`);
  return new S3StorageProvider(
    {
      bucket,
      region: required('PLATFORM_S3_REGION'),
      endpoint: process.env.PLATFORM_S3_ENDPOINT?.trim() || undefined,
      prefix: process.env.PLATFORM_S3_PREFIX?.trim() || undefined,
    },
    {
      accessKeyId: required('PLATFORM_S3_ACCESS_KEY_ID'),
      secretAccessKey: required('PLATFORM_S3_SECRET_ACCESS_KEY'),
    },
    true,
  );
};
