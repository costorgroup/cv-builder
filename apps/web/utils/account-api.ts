import type { TAccountOverview, TEntitlementsSummary } from "@repo/cv-core";
import { apiRequest } from "@/utils/api-client";
import type { TAuthUser } from "@/utils/auth-api";

/** A device signed in to the account. */
export type TAccountSession = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string;
  /** The device making the request. */
  current: boolean;
};

export const accountApi = {
  /** What the signed-in user's plan allows. */
  entitlements: (signal?: AbortSignal) =>
    apiRequest<TEntitlementsSummary>("account/entitlements", {
      method: "GET",
      authenticated: true,
      signal,
    }),
  /** The plan, subscription and usage, for the dashboard. */
  overview: (signal?: AbortSignal) =>
    apiRequest<TAccountOverview>("account/overview", {
      method: "GET",
      authenticated: true,
      signal,
    }),
  updateProfile: (body: { firstName: string; lastName: string }) =>
    apiRequest<{ user: TAuthUser }>("account", {
      method: "PATCH",
      body,
      authenticated: true,
    }),
  /** Deletes the account and everything in it; signs out. */
  deleteAccount: (password: string) =>
    apiRequest("account", {
      method: "DELETE",
      body: { password },
      authenticated: true,
    }),
  sessions: (signal?: AbortSignal) =>
    apiRequest<TAccountSession[]>("account/sessions", {
      method: "GET",
      authenticated: true,
      signal,
    }),
  /** Signs another device out. */
  revokeSession: (id: string) =>
    apiRequest(`account/sessions/${id}`, {
      method: "DELETE",
      authenticated: true,
    }),
  /** Signs out every device but this one. */
  signOutOtherSessions: () =>
    apiRequest<{ count: number }>("account/sessions/sign-out-others", {
      authenticated: true,
    }),
};
