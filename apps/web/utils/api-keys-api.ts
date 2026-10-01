import type { TApiKey, TApiScope, TCreatedApiKey } from "@repo/cv-core";
import { apiRequest } from "@/utils/api-client";

export type { TApiKey, TApiScope, TCreatedApiKey } from "@repo/cv-core";

export type TNewApiKey = {
  name: string;
  scopes: TApiScope[];
  /** Left out for a key that doesn't expire. */
  expiresInDays?: number;
};

/** A team's keys with `teamId`; the signed-in user's own without. */
const base = (teamId?: string) =>
  teamId ? `teams/${encodeURIComponent(teamId)}/api-keys` : "account/api-keys";

export const apiKeysApi = {
  list: (teamId?: string, signal?: AbortSignal) =>
    apiRequest<TApiKey[]>(base(teamId), {
      method: "GET",
      authenticated: true,
      signal,
    }),
  /** The key itself comes back this once only. */
  create: (body: TNewApiKey, teamId?: string) =>
    apiRequest<TCreatedApiKey>(base(teamId), { body, authenticated: true }),
  revoke: (id: string, teamId?: string) =>
    apiRequest(`${base(teamId)}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      authenticated: true,
    }),
};
