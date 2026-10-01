/**
 * Every feature a plan can switch on. The API enforces these keys, so plans
 * (in the database) can only use keys listed here.
 */
export const FEATURES = [
  "cv.download.pdf",
  "template.premium",
  "appearance.allColorSchemes",
  "appearance.allFonts",
  "appearance.resizeSections",
  "cv.multiPage",
  "api.access",
  "embed.builder",
  "embed.whitelabel",
  "storage.external",
  "organization.team",
] as const;

export type TFeature = (typeof FEATURES)[number];

/**
 * Every limit a plan sets. A plan's value is a number, or null for
 * unlimited; a limit the plan doesn't mention is 0, so nothing is allowed by
 * accident.
 */
export const LIMITS = [
  "cv.max",
  "storage.bytes",
  "pdf.monthly",
  "apiKey.max",
  "api.requests.monthly",
  "embed.max",
  "embed.externalUsers.max",
  "org.members.max",
] as const;

export type TLimit = (typeof LIMITS)[number];

/** A limit's value: a maximum, or null for unlimited. */
export type TLimitValue = number | null;

export const isFeature = (value: unknown): value is TFeature =>
  (FEATURES as readonly unknown[]).includes(value);

export const isLimit = (value: unknown): value is TLimit =>
  (LIMITS as readonly unknown[]).includes(value);

/** What the API tells the web app about a plan's entitlements. */
export type TEntitlementsSummary = {
  plan: { key: string; name: string };
  features: TFeature[];
  limits: Record<TLimit, TLimitValue>;
};

/** Things counted per organization per calendar month (UTC). */
export const USAGE_METRICS = ["pdf.generated", "api.request"] as const;

export type TUsageMetric = (typeof USAGE_METRICS)[number];

/** How much of a limit is used; `used` can be over `max` after a downgrade. */
export type TUsage = { used: number; max: TLimitValue };

export type TSubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "EXPIRED";

/** The dashboard's summary of the signed-in user's plan and usage. */
export type TAccountOverview = {
  /** The plan that applies now (Free once a subscription has lapsed). */
  plan: { key: string; name: string };
  /** The subscription as it stands, which may name a plan that has lapsed. */
  subscription: {
    plan: { key: string; name: string };
    status: TSubscriptionStatus;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    trialEndsAt: string | null;
    /** How often it's billed; null for a plan nobody pays for. */
    period: "MONTHLY" | "QUARTERLY" | "YEARLY" | null;
    /** Paid through the payment provider, so it can be changed or canceled. */
    managed: boolean;
  } | null;
  usage: {
    cvs: TUsage;
    storageBytes: TUsage;
    /** PDFs made since the start of this month (UTC). */
    pdfsThisMonth: TUsage;
  };
};

/** Error codes of the 403s the API sends when a plan doesn't allow something. */
export const PLAN_FEATURE_REQUIRED = "PLAN_FEATURE_REQUIRED";
export const PLAN_LIMIT_REACHED = "PLAN_LIMIT_REACHED";
