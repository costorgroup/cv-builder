import type { Request } from 'express';

/** What the web app gets to see of a user. */
export type TPublicUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
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
};

export type TAuthRequest = Request & { auth?: TAuthContext };
