/** The signed-in user's teams, and where a new one is made. */
export const TEAMS_PATH = "/dashboard/teams";

/** A team's pages; its members are its front page. */
export const teamPath = (slug: string) => `/teams/${encodeURIComponent(slug)}`;
export const teamSubscriptionPath = (slug: string) =>
  `${teamPath(slug)}/subscription`;
export const teamSettingsPath = (slug: string) => `${teamPath(slug)}/settings`;
export const teamApiKeysPath = (slug: string) => `${teamPath(slug)}/api-keys`;
export const teamEmbedsPath = (slug: string) => `${teamPath(slug)}/embeds`;

/** Where an invite email links to. */
export const invitePath = (token: string) =>
  `/invite/${encodeURIComponent(token)}`;
