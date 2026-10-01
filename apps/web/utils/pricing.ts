/**
 * Plans as the pricing and home pages show them. What a plan costs and
 * includes comes from the API (`GET /plans`), so it's set in one place; only
 * marketing (which plan to highlight, extra selling points) lives here.
 */

import {
  FEATURES,
  LIMITS,
  type TApproximateCurrency,
  type TLimit,
} from "@repo/cv-core";
import { FEATURE_LABELS, limitLabel } from "@/utils/plan-features";
import type { TPlanPeriod, TPublicPlan } from "@/utils/plans-api";

export type TBillingPeriod = "monthly" | "quarterly" | "yearly";

export type TPlanPrice = {
  /** Charged once per period. */
  total: number;
  months: number;
  currency: string;
};

export type TPlan = {
  id: string;
  name: string;
  tagline: string;
  /** Per billing period; undefined for a free plan. */
  prices?: Partial<Record<TBillingPeriod, TPlanPrice>>;
  /** The currency the page shows prices in (a free plan's "0" too). */
  currency: string;
  /** For an approximate amount in the visitor's currency, e.g. dinars. */
  approximate?: TApproximateCurrency | null;
  features: string[];
  highlighted?: boolean;
};

export const BILLING_PERIODS: { id: TBillingPeriod; label: string }[] = [
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "yearly", label: "Yearly" },
];

const PERIODS: Record<TPlanPeriod, { id: TBillingPeriod; months: number }> = {
  MONTHLY: { id: "monthly", months: 1 },
  QUARTERLY: { id: "quarterly", months: 3 },
  YEARLY: { id: "yearly", months: 12 },
};

/** Marketing per plan key; plans without an entry get none. */
const PLAN_MARKETING: Record<
  string,
  { highlighted?: boolean; extras?: string[] }
> = {
  free: { extras: ["Live preview while you type"] },
  premium: { highlighted: true, extras: ["Priority email support"] },
};

/** Selling points every plan has, shown in the comparison table. */
const ALWAYS_INCLUDED = ["Live preview while you type"];

/**
 * A plan's limit: null (unlimited) as it is, and 0 when the plan doesn't
 * name it. Not `??`, which would turn unlimited into 0.
 */
const limitOf = (plan: TPublicPlan, limit: TLimit) => {
  const value = plan.limits[limit];
  return value === undefined ? 0 : value;
};

/** What a plan without the premium look features still gets. */
const basicLookBullets = (plan: TPublicPlan, freeTemplateCount?: number) => [
  plan.features.includes("template.premium")
    ? undefined
    : freeTemplateCount
      ? `${freeTemplateCount} starter templates`
      : "Starter templates",
  plan.features.includes("appearance.allColorSchemes") ||
  plan.features.includes("appearance.allFonts")
    ? undefined
    : "Default color scheme and font",
];

/**
 * A plan from the API, ready for a plan card, priced in `currency`.
 * `freeTemplateCount` is `GET /plans`'s, for the "starter templates" bullet.
 */
export const toPlan = (
  plan: TPublicPlan,
  currency: string,
  approximate: TApproximateCurrency | null = null,
  freeTemplateCount?: number,
): TPlan => {
  const marketing = PLAN_MARKETING[plan.key] ?? {};
  const prices: Partial<Record<TBillingPeriod, TPlanPrice>> = {};
  for (const { period, amountCents, currency } of plan.prices) {
    const { id, months } = PERIODS[period];
    prices[id] = { total: amountCents / 100, months, currency };
  }
  return {
    id: plan.key,
    name: plan.name,
    tagline: plan.description ?? "",
    prices: plan.prices.length > 0 ? prices : undefined,
    currency: plan.prices[0]?.currency ?? currency,
    approximate,
    features: [
      ...LIMITS.map((limit) => limitLabel(limit, limitOf(plan, limit))),
      ...basicLookBullets(plan, freeTemplateCount),
      ...FEATURES.filter((feature) => plan.features.includes(feature)).map(
        (feature) => FEATURE_LABELS[feature],
      ),
      ...(marketing.extras ?? []),
    ].filter((bullet): bullet is string => !!bullet),
    highlighted: marketing.highlighted,
  };
};

/** Billing periods at least one plan is sold for, in order. */
export const billingPeriodsOf = (plans: TPlan[]) =>
  BILLING_PERIODS.filter(({ id }) => plans.some((plan) => plan.prices?.[id]));

/** A comparison row: what, then each plan's value (text, or included/not). */
export type TPlanComparisonRow = [string, ...(string | boolean)[]];

/**
 * Rows of the plan comparison table, one column per plan: the CV limit, then
 * every feature at least one plan has.
 */
export const planComparison = (plans: TPublicPlan[]): TPlanComparisonRow[] => {
  const cvLimit = (plan: TPublicPlan) => {
    const max = limitOf(plan, "cv.max");
    return max === null ? "Unlimited" : String(max);
  };
  const features = FEATURES.filter((feature) =>
    plans.some((plan) => plan.features.includes(feature)),
  );
  return [
    ["Saved CVs", ...plans.map(cvLimit)],
    ...ALWAYS_INCLUDED.map((label): TPlanComparisonRow => [
      label,
      ...plans.map(() => true),
    ]),
    ...features.map((feature): TPlanComparisonRow => [
      FEATURE_LABELS[feature],
      ...plans.map((plan) => plan.features.includes(feature)),
    ]),
  ];
};

export const formatMoney = (value: number, currency: string) =>
  // A fixed locale, so the server and the browser format prices the same.
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);

/**
 * "≈ 1.175 RSD": `value` in the charged currency, converted at the rate and
 * rounded, in the local style (a fixed locale, as with `formatMoney`).
 */
export const formatApproximate = (
  value: number,
  { currency, rate }: TApproximateCurrency,
) =>
  `≈ ${new Intl.NumberFormat(currency === "RSD" ? "sr-Latn-RS" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value * rate)}`;

/** The note that goes with approximate amounts. */
export const approximateNote = (
  { currency, date, source }: TApproximateCurrency,
  chargedIn: string,
) =>
  `${currency} amounts are approximate, at the ${source} middle rate for ${date}. You're charged in ${chargedIn}.`;

/** How much cheaper per month than paying monthly, in whole percent. */
export const savingPercent = (
  prices: Partial<Record<TBillingPeriod, TPlanPrice>>,
  period: TBillingPeriod,
) => {
  const monthly = prices.monthly?.total;
  const price = prices[period];
  if (!monthly || !price) return 0;
  return Math.round((1 - price.total / price.months / monthly) * 100);
};
