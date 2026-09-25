import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { TAuthContext, TAuthRequest } from './auth.types.js';

/** The signed-in user and session; only on routes behind the AuthGuard. */
export const Auth = createParamDecorator(
  (_: unknown, context: ExecutionContext): TAuthContext => {
    const { auth } = context.switchToHttp().getRequest<TAuthRequest>();
    if (!auth) throw new Error('@Auth() used on a route without AuthGuard');
    return auth;
  },
);
