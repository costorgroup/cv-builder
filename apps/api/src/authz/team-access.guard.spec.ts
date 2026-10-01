import {
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizationRole, PlatformRole } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import {
  TEAM_ROLE_KEY,
  TeamAccessGuard,
  type TTeamRequest,
} from './team-access.guard.js';

class TestController {
  @SetMetadata(TEAM_ROLE_KEY, OrganizationRole.MEMBER)
  read() {}

  @SetMetadata(TEAM_ROLE_KEY, OrganizationRole.OWNER)
  billing() {}
}

const setup = (role: OrganizationRole | null) => {
  const findFirst = vi.fn().mockResolvedValue(role && { role });
  const guard = new TeamAccessGuard(new Reflector(), {
    organizationMember: { findFirst },
  } as unknown as PrismaService);
  const request = {
    auth: { userId: 'me', sessionId: 's', role: PlatformRole.SUPER_ADMIN },
    params: { teamId: 'team' },
  } as unknown as TTeamRequest;
  const context = (handler: keyof TestController) =>
    ({
      getHandler: () => TestController.prototype[handler],
      getClass: () => TestController,
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;
  return { guard, request, context, findFirst };
};

describe('TeamAccessGuard', () => {
  it('404s for a team the user is not in, even a platform admin', async () => {
    const { guard, context } = setup(null);
    await expect(guard.canActivate(context('read'))).rejects.toThrow(
      NotFoundException,
    );
  });

  it('only looks at live team organizations', async () => {
    const { guard, context, findFirst } = setup(OrganizationRole.MEMBER);
    await guard.canActivate(context('read'));
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'me',
          organizationId: 'team',
          organization: { type: 'TEAM', deletedAt: null },
        },
      }),
    );
  });

  it('checks the role and puts the team on the request', async () => {
    const member = setup(OrganizationRole.MEMBER);
    await expect(
      member.guard.canActivate(member.context('billing')),
    ).rejects.toThrow(ForbiddenException);

    const owner = setup(OrganizationRole.OWNER);
    await expect(
      owner.guard.canActivate(owner.context('billing')),
    ).resolves.toBe(true);
    expect(owner.request.team).toEqual({ id: 'team', role: 'OWNER' });
  });
});
