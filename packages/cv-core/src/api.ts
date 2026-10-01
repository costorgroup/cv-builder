/** What an API key may do. Checked on every request to `/v1`. */
export const API_SCOPES = [
  "cv:read",
  "cv:create",
  "cv:update",
  "cv:delete",
  "cv:export",
  "template:read",
  "usage:read",
  "embed:session",
] as const;

export type TApiScope = (typeof API_SCOPES)[number];

export const isApiScope = (value: unknown): value is TApiScope =>
  (API_SCOPES as readonly unknown[]).includes(value);

/** Every API key starts with this, so leaked keys are easy to spot. */
export const API_KEY_PREFIX = "cvb_live_";

/** An API key as its owners see it; the secret is shown only once. */
export type TApiKey = {
  id: string;
  name: string;
  /** The start of the key, e.g. "cvb_live_a1b2c3d4", to tell keys apart. */
  preview: string;
  scopes: TApiScope[];
  createdBy: string | null;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

/** What creating a key returns: the key itself, this one time only. */
export type TCreatedApiKey = { key: string; apiKey: TApiKey };
