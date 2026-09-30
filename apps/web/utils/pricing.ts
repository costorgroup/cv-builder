/**
 * Plans shown on the pricing page and the home page. There's no billing yet,
 * so these are what we plan to offer; nothing enforces the limits.
 */

export type TBillingPeriod = "monthly" | "quarterly" | "yearly";

export type TPlanId = "free" | "premium";

export type TPlanPrice = {
  /** Charged once per period, in euros. */
  total: number;
  months: number;
};

export type TPlan = {
  id: TPlanId;
  name: string;
  tagline: string;
  /** Per billing period; undefined for the free plan. */
  prices?: Record<TBillingPeriod, TPlanPrice>;
  features: string[];
  highlighted?: boolean;
};

export const BILLING_PERIODS: { id: TBillingPeriod; label: string }[] = [
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "yearly", label: "Yearly" },
];

export const PLANS: TPlan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Everything you need for your first great CV.",
    features: [
      "1 saved CV",
      "3 starter templates",
      "Default color scheme and fonts",
      "Live preview while you type",
      "Download as PDF",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "For job seekers tailoring a CV to every application.",
    prices: {
      monthly: { total: 9.99, months: 1 },
      quarterly: { total: 24.99, months: 3 },
      yearly: { total: 79.99, months: 12 },
    },
    features: [
      "Unlimited saved CVs",
      "All templates",
      "Every color scheme and font",
      "Resize sections to fit your content",
      "Multi-page CVs",
      "Priority email support",
    ],
    highlighted: true,
  },
];

/** Rows of the plan comparison table: [feature, free, premium]. */
export const PLAN_COMPARISON: [string, string | boolean, string | boolean][] = [
  ["Saved CVs", "1", "Unlimited"],
  ["Templates", "3", "All"],
  ["Color schemes", "Default", "All"],
  ["Fonts", "Default", "All"],
  ["Live preview", true, true],
  ["PDF download", true, true],
  ["Resizable sections", false, true],
  ["Multi-page CVs", false, true],
  ["Priority support", false, true],
];

const euro = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
});

export const formatEuro = (value: number) => euro.format(value);

/** How much cheaper per month than paying monthly, in whole percent. */
export const savingPercent = (
  prices: Record<TBillingPeriod, TPlanPrice>,
  period: TBillingPeriod,
) => {
  const monthly = prices.monthly.total;
  const perMonth = prices[period].total / prices[period].months;
  return Math.round((1 - perMonth / monthly) * 100);
};
