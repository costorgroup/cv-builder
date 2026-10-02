import { BadRequestException } from '@nestjs/common';
import { Readable } from 'node:stream';
import { PlanLimitReachedException } from '../entitlements/entitlements.errors.js';
import type { EntitlementService } from '../entitlements/entitlements.service.js';
import { resolveEntitlements } from '../entitlements/resolve-entitlements.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AssetsService, assetUrl, imageTypeOf } from './assets.service.js';
import type { StorageConfigsService } from './storage-configs.service.js';
import type { StorageProvider } from './storage-provider.js';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
const ORG = '11111111-1111-1111-1111-111111111111';
const A = '22222222-2222-2222-2222-222222222222';

type TRow = {
  id: string;
  organizationId: string;
  cvId: string | null;
  userId: string | null;
  externalUserId: string | null;
  storageKey: string;
  contentType: string;
  sizeBytes: number;
  kind: 'PHOTO';
  storage?: 'PLATFORM' | 'S3';
};

const setup = ({
  storageMax = null as number | null,
  used = 0,
  rows = [] as TRow[],
} = {}) => {
  const files = new Map<string, Buffer>();
  const platform: StorageProvider = {
    put: vi.fn(async (key: string, body: Buffer) => void files.set(key, body)),
    get: vi.fn(async (key: string) =>
      files.has(key) ? Readable.from([files.get(key)!]) : null,
    ),
    delete: vi.fn(async (key: string) => void files.delete(key)),
    deletePrefix: vi.fn(async () => undefined),
  };
  for (const row of rows) files.set(row.storageKey, JPEG);
  const prisma = {
    organization: {
      findUniqueOrThrow: vi.fn().mockResolvedValue({ id: ORG }),
    },
    cv: { aggregate: vi.fn().mockResolvedValue({ _sum: { sizeBytes: used } }) },
    asset: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { sizeBytes: 0 } }),
      create: vi.fn(async ({ data }: { data: Partial<TRow> }) => {
        rows.push({
          cvId: null,
          userId: null,
          externalUserId: null,
          ...data,
        } as TRow);
      }),
      findFirst: vi.fn(
        async ({ where }: { where: { id: string; userId?: string } }) =>
          rows.find(
            (row) => row.id === where.id && row.userId === where.userId,
          ) ?? null,
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: { cvId: string };
        }) => {
          const row = rows.find(({ id }) => id === where.id);
          if (row) row.cvId = data.cvId;
        },
      ),
      findMany: vi.fn(
        async ({ where }: { where: { cvId: string; id?: { not: string } } }) =>
          rows.filter(
            (row) => row.cvId === where.cvId && row.id !== where.id?.not,
          ),
      ),
      deleteMany: vi.fn(
        async ({ where }: { where: { id: { in: string[] } } }) => {
          for (const id of where.id.in) {
            rows.splice(
              rows.findIndex((row) => row.id === id),
              1,
            );
          }
        },
      ),
    },
    $transaction: vi.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };
  const service = new AssetsService(
    prisma as unknown as PrismaService,
    {
      forOrganization: vi.fn().mockResolvedValue(
        resolveEntitlements(
          null,
          {
            key: 'p',
            name: 'P',
            features: [],
            limits: { 'storage.bytes': storageMax },
          },
          new Date(),
        ),
      ),
    } as unknown as EntitlementService,
    {
      activeProvider: vi.fn().mockResolvedValue(null),
      providerFor: vi.fn().mockResolvedValue(null),
    } as unknown as StorageConfigsService,
  );
  (service as unknown as { platform: StorageProvider }).platform = platform;
  return { service, rows, files };
};

const row = (overrides: Partial<TRow>): TRow => ({
  id: A,
  organizationId: ORG,
  cvId: null,
  userId: 'me',
  externalUserId: null,
  storageKey: `org/${ORG}/assets/${A}`,
  contentType: 'image/jpeg',
  sizeBytes: JPEG.length,
  kind: 'PHOTO',
  storage: 'PLATFORM',
  ...overrides,
});

describe('imageTypeOf', () => {
  it('knows images by their bytes, not their name', () => {
    expect(imageTypeOf(JPEG)).toBe('image/jpeg');
    expect(imageTypeOf(PNG)).toBe('image/png');
    expect(imageTypeOf(Buffer.from('RIFF0000WEBPVP8 '))).toBe('image/webp');
    expect(imageTypeOf(Buffer.from('<svg onload=alert(1)>'))).toBeNull();
  });
});

describe('AssetsService', () => {
  it('stores a photo under its organization and returns its link', async () => {
    const { service, rows, files } = setup();
    const { id, url } = await service.uploadPhoto('me', JPEG);
    expect(url).toBe(assetUrl(id));
    expect([...files.keys()]).toEqual([`org/${ORG}/assets/${id}`]);
    expect(rows[0]).toMatchObject({
      userId: 'me',
      cvId: null,
      contentType: 'image/jpeg',
    });
  });

  it('refuses files that are not images', async () => {
    await expect(
      setup().service.uploadPhoto('me', Buffer.from('%PDF-1.7')),
    ).rejects.toThrow(BadRequestException);
  });

  it('keeps within the plan storage', async () => {
    await expect(
      setup({ storageMax: 10, used: 8 }).service.uploadPhoto('me', JPEG),
    ).rejects.toThrow(PlanLimitReachedException);
  });

  it('moves an inline photo out of the CV', async () => {
    const { service } = setup();
    const data = {
      name: 'x',
      personalInformation: {
        firstName: 'Ana',
        photo: `data:image/jpeg;base64,${JPEG.toString('base64')}`,
      },
    };
    const moved = await service.moveInlinePhoto('me', data);
    expect(moved.personalInformation.photo).toMatch(
      /^\/api\/assets\/[0-9a-f-]{36}$/,
    );
    expect(moved.personalInformation.firstName).toBe('Ana');
  });

  it('makes an upload the CV’s own, and removes the photo it replaced', async () => {
    const old = '33333333-3333-3333-3333-333333333333';
    const { service, rows } = setup({
      rows: [
        row({}),
        row({ id: old, cvId: 'cv1', storageKey: `org/${ORG}/assets/${old}` }),
      ],
    });
    await service.attach('me', 'cv1', {
      personalInformation: { photo: assetUrl(A) },
    });
    expect(rows.map(({ id, cvId }) => [id, cvId])).toEqual([[A, 'cv1']]);
  });

  it('copies a photo another CV uses, so each keeps its own', async () => {
    const { service, rows } = setup({ rows: [row({ cvId: 'original' })] });
    const data = await service.attach('me', 'copy', {
      personalInformation: { photo: assetUrl(A) },
    });
    expect(data.personalInformation.photo).not.toBe(assetUrl(A));
    expect(rows.map(({ cvId }) => cvId).sort()).toEqual(['copy', 'original']);
  });

  it("won't take on someone else's upload", async () => {
    const { service, rows } = setup({ rows: [row({ userId: 'someone' })] });
    await service.attach('me', 'cv1', {
      personalInformation: { photo: assetUrl(A) },
    });
    expect(rows[0]?.cvId).toBeNull();
  });
});
