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
 * hasn't been revoked, and puts the user on `request.auth`.
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
    // Checked so signing out or resetting the password takes effect at once,
    // not when the access token runs out.
    if (!(await this.authService.sessionExists(payload.sid))) {
      throw new UnauthorizedException();
    }

    request.auth = { userId: payload.sub, sessionId: payload.sid };
    return true;
  }
}
