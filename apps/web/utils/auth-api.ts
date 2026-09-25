import { apiRequest } from "@/utils/api-client";

export { ApiError } from "@/utils/api-client";

/** A user as the API returns it. */
export type TAuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  createdAt: string;
};

export const authApi = {
  signUp: (body: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) =>
    apiRequest<{ user: TAuthUser }>("auth/sign-up", { body }),
  signIn: (body: { email: string; password: string }) =>
    apiRequest<{ user: TAuthUser }>("auth/sign-in", { body }),
  signOut: () => apiRequest("auth/sign-out"),
  me: () =>
    apiRequest<{ user: TAuthUser }>("auth/me", {
      method: "GET",
      authenticated: true,
    }),
  verifyAccount: (token: string) =>
    apiRequest("auth/verify-account", { body: { token } }),
  resendVerification: () =>
    apiRequest("auth/resend-verification", { authenticated: true }),
  forgotPassword: (email: string) =>
    apiRequest("auth/forgot-password", { body: { email } }),
  resetPassword: (body: { token: string; password: string }) =>
    apiRequest("auth/reset-password", { body }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    apiRequest("auth/change-password", { body, authenticated: true }),
};

/** Where to land after signing in. */
export const DEFAULT_SIGNED_IN_PATH = "/dashboard";

/** Only same-site paths, so `?next=` can't send the user elsewhere. */
export const safeRedirectPath = (path: string | null | undefined) =>
  path && /^\/(?![/\\])/.test(path) ? path : DEFAULT_SIGNED_IN_PATH;

export const fullName = ({ firstName, lastName }: TAuthUser) =>
  `${firstName} ${lastName}`.trim();
