import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import type { TAccessTokenPayload, TAuthRequest } from './auth.types.js';
import { ACCESS_TOKEN_COOKIE } from './utils/cookies.js';

/**
 * Lets a request through only with a valid access token cookie whose session
 * hasn't been revoked and whose account isn't disabled, and puts the user
 * (with their platform role) on `request.auth`.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<TAuthRequest>();
    const token: unknown = request.cookies?.[ACCESS_TOKEN_COOKIE];
    if (typeof token !== 'string') throw new UnauthorizedException();

    let payload: TAccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<TAccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }
    // Checked so signing out, resetting the password or disabling the account
    // takes effect at once, not when the access token runs out.
    const user = await this.authService.findActiveSessionUser(payload.sid);
    if (!user || user.id !== payload.sub) throw new UnauthorizedException();

    // Not awaited: it's a rare write that the request shouldn't wait on.
    void this.authService.recordActivity(user);
    request.auth = {
      userId: user.id,
      sessionId: payload.sid,
      role: user.role,
    };
    return true;
  }
}
