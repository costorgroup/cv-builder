import type {
  TAccountOverview,
  TEntitlementsSummary,
  TInvitePreview,
  TOrganizationRole,
  TTeamInvite,
  TTeamMember,
  TTeamSummary,
} from "@repo/cv-core";
import { apiRequest } from "@/utils/api-client";

export type {
  TInvitePreview,
  TOrganizationRole,
  TTeamInvite,
  TTeamMember,
  TTeamSummary,
} from "@repo/cv-core";

const team = (id: string) => `teams/${encodeURIComponent(id)}`;

const get = <T>(path: string, signal?: AbortSignal) =>
  apiRequest<T>(path, { method: "GET", authenticated: true, signal });

export const teamsApi = {
  /** The teams the signed-in user is in. */
  list: (signal?: AbortSignal) => get<TTeamSummary[]>("teams", signal),
  create: (name: string) =>
    apiRequest<TTeamSummary>("teams", { body: { name }, authenticated: true }),
  rename: (id: string, name: string) =>
    apiRequest<TTeamSummary>(team(id), {
      method: "PATCH",
      body: { name },
      authenticated: true,
    }),
  /** Owner only; refused while a paid plan still renews. */
  delete: (id: string) =>
    apiRequest(team(id), { method: "DELETE", authenticated: true }),
  entitlements: (id: string, signal?: AbortSignal) =>
    get<TEntitlementsSummary>(`${team(id)}/entitlements`, signal),
  overview: (id: string, signal?: AbortSignal) =>
    get<TAccountOverview>(`${team(id)}/overview`, signal),
  members: (id: string, signal?: AbortSignal) =>
    get<TTeamMember[]>(`${team(id)}/members`, signal),
  setRole: (id: string, userId: string, role: TOrganizationRole) =>
    apiRequest(`${team(id)}/members/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body: { role },
      authenticated: true,
    }),
  /** Removes a member; with the caller's own id, leaves the team. */
  removeMember: (id: string, userId: string) =>
    apiRequest(`${team(id)}/members/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      authenticated: true,
    }),
  transferOwnership: (id: string, userId: string) =>
    apiRequest(`${team(id)}/transfer-ownership`, {
      body: { userId },
      authenticated: true,
    }),
  invites: (id: string, signal?: AbortSignal) =>
    get<TTeamInvite[]>(`${team(id)}/invites`, signal),
  invite: (id: string, email: string, role: TOrganizationRole) =>
    apiRequest<{ id: string }>(`${team(id)}/invites`, {
      body: { email, role },
      authenticated: true,
    }),
  revokeInvite: (id: string, inviteId: string) =>
    apiRequest(`${team(id)}/invites/${encodeURIComponent(inviteId)}`, {
      method: "DELETE",
      authenticated: true,
    }),
};

export const invitesApi = {
  /** Public: what an invite link is for. */
  preview: (token: string, signal?: AbortSignal) =>
    apiRequest<TInvitePreview>(`invites/${encodeURIComponent(token)}`, {
      method: "GET",
      signal,
    }),
  accept: (token: string) =>
    apiRequest<TTeamSummary>(`invites/${encodeURIComponent(token)}/accept`, {
      authenticated: true,
    }),
};
