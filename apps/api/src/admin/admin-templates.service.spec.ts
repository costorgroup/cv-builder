import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { AuditService } from '../audit/audit.service.js';
import type { TAuthContext } from '../auth/auth.types.js';
import { PlatformRole } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { TemplatesService } from '../templates/templates.service.js';
import { AdminTemplatesService } from './admin-templates.service.js';

const admin: TAuthContext = {
  userId: 'a',
  sessionId: 's',
  role: PlatformRole.ADMIN,
};
const superAdmin: TAuthContext = { ...admin, role: PlatformRole.SUPER_ADMIN };

const setup = () => {
  const update = vi.fn().mockResolvedValue({});
  const clearCache = vi.fn();
  const record = vi.fn();
  const prisma = {
    template: {
      findUnique: vi.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve({ id: where.id }),
      ),
      findMany: vi.fn().mockResolvedValue([
        { id: 'modern', tier: 'PREMIUM', status: 'PUBLISHED' },
        { id: 'retired-in-code', tier: 'FREE', status: 'HIDDEN' },
      ]),
      update,
    },
    cv: {
      groupBy: vi
        .fn()
        .mockResolvedValue([{ templateId: 'modern', _count: { _all: 4 } }]),
    },
  };
  const service = new AdminTemplatesService(
    prisma as unknown as PrismaService,
    { clearCache } as unknown as TemplatesService,
    { record } as unknown as AuditService,
  );
  return { service, update, clearCache, record };
};

describe('AdminTemplatesService', () => {
  it('lists templates in code with their names and CV counts', async () => {
    const { service } = setup();
    expect(await service.list()).toEqual([
      expect.objectContaining({ id: 'modern', name: 'Modern', cvs: 4 }),
    ]);
  });

  it('lets only super admins change a template', async () => {
    const { service, update } = setup();
    await expect(
      service.update(admin, 'modern', { tier: 'FREE' }),
    ).rejects.toThrow(ForbiddenException);
    expect(update).not.toHaveBeenCalled();
  });

  it('keeps the default template published and free', async () => {
    const { service, update } = setup();
    await expect(
      service.update(superAdmin, 'default', { status: 'HIDDEN' }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.update(superAdmin, 'default', { tier: 'PREMIUM' }),
    ).rejects.toThrow(BadRequestException);
    await service.update(superAdmin, 'default', { category: 'Simple' });
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('refuses templates that only exist in the database', async () => {
    const { service } = setup();
    await expect(
      service.update(superAdmin, 'retired-in-code', { tier: 'FREE' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('saves, clears the cache and records it; empty category clears it', async () => {
    const { service, update, clearCache, record } = setup();
    await service.update(superAdmin, 'modern', {
      status: 'HIDDEN',
      category: '',
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'modern' },
      data: {
        tier: undefined,
        status: 'HIDDEN',
        category: null,
        sortOrder: undefined,
      },
    });
    expect(clearCache).toHaveBeenCalled();
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'TEMPLATE_UPDATED',
        resource: { type: 'template', id: 'modern' },
        metadata: { changed: ['status', 'category'], status: 'HIDDEN' },
      }),
    );
  });
});
