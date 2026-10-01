import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { TTemplateCatalog } from '@repo/cv-core';
import type { AuditService } from '../audit/audit.service.js';
import { hashToken } from '../auth/utils/token.js';
import type { EntitlementService } from '../entitlements/entitlements.service.js';
import { resolveEntitlements } from '../entitlements/resolve-entitlements.js';
import type { EmbedConfig } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { TemplatesService } from '../templates/templates.service.js';
import {
  normalizeOrigin,
  parseEmbedInput,
  resolveEmbedConfig,
} from './embed-config.js';
import type { EmbedTokens } from './embed-token.js';
import { EmbedsService } from './embeds.service.js';

const plan = (features: string[], limits: Record<string, number | null> = {}) =>
  resolveEntitlements(
    null,
    { key: 'p', name: 'P', features, limits },
    new Date(),
  );

const CATALOG: TTemplateCatalog = {
  available: ['default', 'modern', 'classic'],
  free: ['default', 'classic'],
};

const config = (overrides: Partial<EmbedConfig> = {}): EmbedConfig => ({
  id: 'cfg',
  organizationId: 'org',
  name: 'Careers',
  publicKey: 'pk_000000000000000000000000',
  allowedOrigins: ['https://careers.acme.com'],
  theme: {},
  branding: { showPlatformBranding: false },
  templateIds: [],
  sections: [],
  features: ['pdf.download'],
  disabledAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('normalizeOrigin', () => {
  it('accepts https origins and localhost for testing', () => {
    expect(normalizeOrigin('https://careers.acme.com/')).toBe(
      'https://careers.acme.com',
    );
    expect(normalizeOrigin('http://localhost:5173')).toBe(
      'http://localhost:5173',
    );
  });

  it('refuses http, paths and things that are not addresses', () => {
    expect(normalizeOrigin('http://acme.com')).toHaveProperty('error');
    expect(normalizeOrigin('https://acme.com/jobs')).toHaveProperty('error');
    expect(normalizeOrigin('*.acme.com')).toHaveProperty('error');
  });
});

describe('parseEmbedInput', () => {
  it('cleans what it accepts', () => {
    expect(
      parseEmbedInput({
        allowedOrigins: ['https://a.com', 'https://a.com/'],
        theme: { primaryColor: '#4F46E5', radius: 8 },
        sections: ['skills', 'templates', 'skills'],
      }),
    ).toMatchObject({
      allowedOrigins: ['https://a.com'],
      theme: { primaryColor: '#4f46e5', radius: 8 },
      sections: ['skills', 'templates'],
    });
  });

  it('names everything wrong at once', () => {
    expect(() =>
      parseEmbedInput({
        theme: { primaryColor: 'red', radius: 99 },
        templateIds: ['nope'],
        features: ['everything'],
      }),
    ).toThrow(BadRequestException);
  });
});

describe('resolveEmbedConfig', () => {
  it('offers only templates the plan includes, in step order', () => {
    const resolved = resolveEmbedConfig(
      config({
        templateIds: ['modern', 'classic'],
        sections: ['skills', 'templates'],
      }),
      plan(['embed.builder', 'cv.download.pdf']),
      CATALOG,
    );
    expect(resolved.templateIds).toEqual(['classic']);
    expect(resolved.sections).toEqual(['templates', 'skills']);
  });

  it('falls back to the free templates rather than none', () => {
    expect(
      resolveEmbedConfig(
        config({ templateIds: ['modern'] }),
        plan(['embed.builder']),
        CATALOG,
      ).templateIds,
    ).toEqual(['default', 'classic']);
  });

  it('shows our branding unless the plan is white-label', () => {
    expect(
      resolveEmbedConfig(config(), plan(['embed.builder']), CATALOG).branding
        .showPlatformBranding,
    ).toBe(true);
    expect(
      resolveEmbedConfig(
        config(),
        plan(['embed.builder', 'embed.whitelabel']),
        CATALOG,
      ).branding.showPlatformBranding,
    ).toBe(false);
  });

  it('drops downloads when the plan has no PDFs', () => {
    expect(
      resolveEmbedConfig(config(), plan(['embed.builder']), CATALOG).features,
    ).toEqual([]);
  });
});

describe('EmbedsService.exchange', () => {
  const setup = (deleted = 1, features = ['embed.builder']) => {
    const sign = vi.fn().mockResolvedValue('embed.jwt');
    const prisma = {
      embedConfig: {
        findUnique: vi
          .fn()
          .mockResolvedValue({
            ...config(),
            organization: { deletedAt: null },
          }),
      },
      embedLaunchToken: {
        findUnique: vi.fn().mockResolvedValue({
          embedConfigId: 'cfg',
          externalUserId: 'xu',
        }),
        deleteMany: vi.fn().mockResolvedValue({ count: deleted }),
      },
      externalUser: { update: vi.fn() },
    };
    const service = new EmbedsService(
      prisma as unknown as PrismaService,
      {
        forOrganization: vi.fn().mockResolvedValue(plan(features)),
      } as unknown as EntitlementService,
      {
        catalog: vi.fn().mockResolvedValue(CATALOG),
      } as unknown as TemplatesService,
      { sign } as unknown as EmbedTokens,
      { record: vi.fn() } as unknown as AuditService,
    );
    return { service, prisma, sign };
  };

  it('trades a launch token for a session once', async () => {
    const { service, prisma, sign } = setup();
    await expect(
      service.exchange('pk_000000000000000000000000', 'token'),
    ).resolves.toMatchObject({ embedToken: 'embed.jwt' });
    expect(prisma.embedLaunchToken.deleteMany).toHaveBeenCalledWith({
      where: {
        tokenHash: hashToken('token'),
        expiresAt: { gt: expect.any(Date) },
      },
    });
    expect(sign).toHaveBeenCalledWith({ org: 'org', xu: 'xu', cfg: 'cfg' });
  });

  it('refuses a used or expired token', async () => {
    await expect(
      setup(0).service.exchange('pk_000000000000000000000000', 'token'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('refuses a page that is not allowed to frame it', async () => {
    await expect(
      setup().service.exchange(
        'pk_000000000000000000000000',
        'token',
        'https://evil.example',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('is gone once the plan loses embedding', async () => {
    await expect(
      setup(1, []).service.exchange('pk_000000000000000000000000', 'token'),
    ).rejects.toThrow(NotFoundException);
  });
});
