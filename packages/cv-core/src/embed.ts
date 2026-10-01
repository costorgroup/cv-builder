import type { TFeature } from "./entitlements.js";

/** The editor's steps, in order; each is a URL segment. */
export const CV_EDITOR_STEPS = [
  "templates",
  "appearance",
  "personal-information",
  "social-media",
  "work-experience",
  "education",
  "skills",
  "languages",
  "projects",
  "certificates",
  "interests",
] as const;

export type TCvEditorStep = (typeof CV_EDITOR_STEPS)[number];

export const isCvEditorStep = (value: string): value is TCvEditorStep =>
  (CV_EDITOR_STEPS as readonly string[]).includes(value);

/**
 * Extras an embed can turn on, each also needing the plan's feature:
 * downloading a PDF needs `cv.download.pdf`.
 */
export const EMBED_FEATURES = ["pdf.download"] as const;

export type TEmbedFeature = (typeof EMBED_FEATURES)[number];

/** How an embedded builder looks; anything left out uses the defaults. */
export type TEmbedTheme = {
  /** Buttons, links and the selected step, e.g. "#4f46e5". */
  primaryColor?: string;
  /** "light" or "dark"; follows the visitor's system when left out. */
  mode?: "light" | "dark";
  /** Corner rounding of cards and buttons, in pixels (0–24). */
  radius?: number;
};

export type TEmbedBranding = {
  /** Shown at the top of the builder instead of ours. */
  companyName?: string;
  /** An https image URL shown beside the company name. */
  logoUrl?: string;
  /**
   * "Made with CV Builder" at the bottom. Hiding it needs a plan with
   * `embed.whitelabel`; without one it always shows.
   */
  showPlatformBranding?: boolean;
};

/** An embed as its owners set it up (`GET /account/embeds`). */
export type TEmbedConfig = {
  id: string;
  name: string;
  publicKey: string;
  allowedOrigins: string[];
  theme: TEmbedTheme;
  branding: TEmbedBranding;
  /** Empty: every template the plan includes. */
  templateIds: string[];
  /** Empty: every step. */
  sections: TCvEditorStep[];
  features: TEmbedFeature[];
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * What the embedded builder runs with: the config clamped to the plan, so
 * the page and the API apply the same rules.
 */
export type TResolvedEmbedConfig = {
  publicKey: string;
  theme: TEmbedTheme;
  branding: TEmbedBranding & { showPlatformBranding: boolean };
  templateIds: string[];
  /** Templates every plan includes, of `templateIds`. */
  freeTemplateIds: string[];
  sections: TCvEditorStep[];
  features: TEmbedFeature[];
  /** What the organization's plan includes, for showing what's locked. */
  planFeatures: TFeature[];
};

/** The loader's events to the customer's page, as `postMessage` types. */
export const EMBED_EVENTS = {
  ready: "cvbuilder:ready",
  saved: "cvbuilder:saved",
  sessionExpired: "cvbuilder:session-expired",
  launch: "cvbuilder:launch",
} as const;
