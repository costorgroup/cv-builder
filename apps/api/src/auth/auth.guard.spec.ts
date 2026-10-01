import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { PlatformRole } from '../generated/prisma/client.js';
import { AuthGuard } from './auth.guard.js';
import type { AuthService } from './auth.service.js';
import type { TActiveSessionUser, TAuthRequest } from './auth.types.js';
import { ACCESS_TOKEN_COOKIE } from './utils/cookies.js';

const USER: TActiveSessionUser = {
  id: 'user-1',
  role: PlatformRole.ADMIN,
  lastActiveAt: null,
};

const setup = (sessionUser: TActiveSessionUser | null) => {
  const jwt = {
    verifyAsync: vi.fn().mockResolvedValue({ sub: 'user-1', sid: 'session-1' }),
  };
  const authService = {
    findActiveSessionUser: vi.fn().mockResolvedValue(sessionUser),
    recordActivity: vi.fn().mockResolvedValue(undefined),
  };
  const request = {
    cookies: { [ACCESS_TOKEN_COOKIE]: 'token' },
  } as unknown as TAuthRequest;
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  const guard = new AuthGuard(
    jwt as unknown as JwtService,
    authService as unknown as AuthService,
  );
  return { guard, context, request, authService };
};

describe('AuthGuard', () => {
  it('puts the user and their role from the database on the request', async () => {
    const { guard, context, request, authService } = setup(USER);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.auth).toEqual({
      userId: 'user-1',
      sessionId: 'session-1',
      role: PlatformRole.ADMIN,
    });
    expect(authService.findActiveSessionUser).toHaveBeenCalledWith('session-1');
    expect(authService.recordActivity).toHaveBeenCalledWith(USER);
  });

  it('rejects a revoked or expired session, or a disabled account', async () => {
    // All three come back from findActiveSessionUser as null.
    const { guard, context, request } = setup(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(request.auth).toBeUndefined();
  });

  it('rejects a token whose session belongs to someone else', async () => {
    const { guard, context } = setup({ ...USER, id: 'user-2' });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a request without an access token', async () => {
    const { guard, context, request, authService } = setup(USER);
    request.cookies = {};

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(authService.findActiveSessionUser).not.toHaveBeenCalled();
  });
});
