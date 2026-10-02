import type {
  TCvEditorStep,
  TEmbedBranding,
  TEmbedConfig,
  TEmbedFeature,
  TEmbedTheme,
} from "@repo/cv-core";
import { apiRequest } from "@/utils/api-client";

export type { TEmbedConfig } from "@repo/cv-core";

export type TEmbedInput = {
  name?: string;
  allowedOrigins?: string[];
  theme?: TEmbedTheme;
  branding?: TEmbedBranding;
  templateIds?: string[];
  sections?: TCvEditorStep[];
  features?: TEmbedFeature[];
  disabled?: boolean;
};

/** A team's embeds with `teamId`; the signed-in user's own without. */
const base = (teamId?: string) =>
  teamId ? `teams/${encodeURIComponent(teamId)}/embeds` : "account/embeds";

export const embedsApi = {
  list: (teamId?: string, signal?: AbortSignal) =>
    apiRequest<TEmbedConfig[]>(base(teamId), {
      method: "GET",
      authenticated: true,
      signal,
    }),
  create: (body: TEmbedInput, teamId?: string) =>
    apiRequest<TEmbedConfig>(base(teamId), { body, authenticated: true }),
  update: (id: string, body: TEmbedInput, teamId?: string) =>
    apiRequest<TEmbedConfig>(`${base(teamId)}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body,
      authenticated: true,
    }),
  /** A one-time token to try the embed as its preview user. */
  preview: (id: string, teamId?: string) =>
    apiRequest<{ launchToken: string }>(
      `${base(teamId)}/${encodeURIComponent(id)}/preview`,
      { authenticated: true },
    ),
  remove: (id: string, teamId?: string) =>
    apiRequest(`${base(teamId)}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      authenticated: true,
    }),
};
