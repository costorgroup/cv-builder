import type { Request } from 'express';
import type { PlatformRole } from '../generated/prisma/client.js';

/** What the web app gets to see of a user. */
export type TPublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  /** For showing admin links; the API checks it again on every request. */
  role: PlatformRole;
  createdAt: Date;
};

export type TAuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type TAuthSession = TAuthTokens & { user: TPublicUser };

/** Claims carried by the access token. */
export type TAccessTokenPayload = {
  sub: string;
  sid: string;
};

/** Set on the request by the AuthGuard. */
export type TAuthContext = {
  userId: string;
  sessionId: string;
  /** Read from the database on every request, never from the token. */
  role: PlatformRole;
};

export type TAuthRequest = Request & { auth?: TAuthContext };

/** The device a session is for, from the request that starts or refreshes it. */
export type TSessionClient = {
  userAgent?: string;
  ipAddress?: string;
};

/** What the AuthGuard loads about the user behind a valid session. */
export type TActiveSessionUser = {
  id: string;
  role: PlatformRole;
  lastActiveAt: Date | null;
};
