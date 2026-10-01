import { Injectable, Logger } from '@nestjs/common';
import type { TAuditAction } from '@repo/cv-core';
import { AuditActorType, type Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { currentRequestContext } from './request-context.js';

export { AUDIT_ACTIONS, type TAuditAction } from '@repo/cv-core';

export type TAuditActor =
  | { type: 'USER'; id: string }
  | { type: 'API_KEY'; id: string }
  | { type: 'EXTERNAL_USER'; id: string }
  | { type: 'SYSTEM'; id?: string };

export type TAuditEntry = {
  actor: TAuditActor;
  action: TAuditAction;
  resource: { type: string; id?: string | null };
  organizationId?: string | null;
  metadata?: Record<string, unknown>;
};

/** Keys whose values are never stored, however they're nested. */
const SECRET_KEY =
  /pass(word)?|token|secret|api.?key|hash|authorization|cookie|card|cvv|signature/i;

/** A copy with anything that looks like a secret replaced. */
export const withoutSecrets = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(withoutSecrets);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, each]) => [
        key,
        SECRET_KEY.test(key) ? '[redacted]' : withoutSecrets(each),
      ]),
    );
  }
  return value;
};

/**
 * Records important actions: who did what, to what, when, and from where.
 * Never throws: a failed entry is logged, not allowed to undo the action.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record({
    actor,
    action,
    resource,
    organizationId,
    metadata,
  }: TAuditEntry) {
    const { ipAddress, userAgent } = currentRequestContext();
    try {
      await this.prisma.auditLog.create({
        data: {
          actorType: AuditActorType[actor.type],
          actorId: actor.id ?? null,
          organizationId: organizationId ?? null,
          action,
          resourceType: resource.type,
          resourceId: resource.id ?? null,
          metadata: (withoutSecrets(metadata ?? {}) ??
            {}) as Prisma.InputJsonObject,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Couldn't record ${action}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
