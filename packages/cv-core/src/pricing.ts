import type { TLimitValue } from "./entitlements.js";

/** Prices are shown in this currency when there are none in the visitor's. */
export const DEFAULT_CURRENCY = "EUR";

/** Cookie holding the currency a visitor picked, e.g. "USD". */
export const CURRENCY_COOKIE = "currency";

export type TPlanPeriod = "MONTHLY" | "QUARTERLY" | "YEARLY";

export type TPublicPlanPrice = {
  period: TPlanPeriod;
  amountCents: number;
  currency: string;
};

/** A plan as the pricing page shows it. */
export type TPublicPlan = {
  key: string;
  name: string;
  description: string | null;
  features: string[];
  limits: Record<string, TLimitValue>;
  /**
   * One per period, in the chosen currency where the plan has a price in it,
   * in `DEFAULT_CURRENCY` otherwise.
   */
  prices: TPublicPlanPrice[];
};

/**
 * A rate for showing prices approximately in the visitor's own currency,
 * when they're charged in another (e.g. dinars for Serbia, charged in EUR).
 */
export type TApproximateCurrency = {
  currency: string;
  /** Units of `currency` per one unit of the charged currency. */
  rate: number;
  /** The day the rate is for, e.g. "2026-09-30". */
  date: string;
  /** Where the rate is from, e.g. "National Bank of Serbia". */
  source: string;
};

/** What `GET /plans` returns. */
export type TPublicPlans = {
  /** The currency the prices were picked in. */
  currency: string;
  /** For showing the prices approximately in the visitor's currency. */
  approximate: TApproximateCurrency | null;
  /** Every currency there are prices in, for a currency picker. */
  currencies: string[];
  plans: TPublicPlan[];
  /** How many published templates plans without `template.premium` get. */
  freeTemplateCount: number;
};
