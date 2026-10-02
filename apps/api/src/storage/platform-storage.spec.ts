import { LocalStorageProvider } from './local-storage.provider.js';
import { createPlatformStorage } from './platform-storage.js';
import { S3StorageProvider } from './s3/s3-storage.provider.js';

describe('createPlatformStorage', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('uses the local disk by default', () => {
    delete process.env.PLATFORM_STORAGE;
    expect(createPlatformStorage()).toBeInstanceOf(LocalStorageProvider);
  });

  it('uses a bucket when configured', () => {
    Object.assign(process.env, {
      PLATFORM_STORAGE: 's3',
      PLATFORM_S3_BUCKET: 'cv-builder-files',
      PLATFORM_S3_REGION: 'eu-central-1',
      PLATFORM_S3_ACCESS_KEY_ID: 'AKIA…',
      PLATFORM_S3_SECRET_ACCESS_KEY: 'secret',
    });
    expect(createPlatformStorage()).toBeInstanceOf(S3StorageProvider);
  });

  it('names a missing setting rather than starting half-configured', () => {
    Object.assign(process.env, {
      PLATFORM_STORAGE: 's3',
      PLATFORM_S3_BUCKET: 'x',
    });
    delete process.env.PLATFORM_S3_REGION;
    expect(() => createPlatformStorage()).toThrow(/PLATFORM_S3_REGION/);
  });
});
