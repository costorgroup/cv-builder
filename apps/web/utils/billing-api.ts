import type { TPlanPeriod } from "@repo/cv-core";
import { apiRequest } from "@/utils/api-client";

/** How the browser opens a checkout; `provider: "none"` when payments are off. */
export type TBillingConfig =
  | { provider: "none" }
  | {
      provider: "paddle";
      environment: "sandbox" | "production";
      clientToken: string;
    };

/**
 * Which account a billing action is for: a team the user owns (`teamId`),
 * or their own when it's left out.
 */
type TBillingTarget = { teamId?: string };

type TPlanChoice = TBillingTarget & { planKey: string; period: TPlanPeriod };

export const billingApi = {
  config: () => apiRequest<TBillingConfig>("billing/config", { method: "GET" }),
  /** A checkout for a plan; open it with the provider's checkout. */
  startCheckout: (body: TPlanChoice) =>
    apiRequest<{ checkoutId: string }>("billing/checkout", {
      body,
      authenticated: true,
    }),
  /** After paying: applies the new plan; "pending" if it's still processing. */
  completeCheckout: (checkoutId: string, target: TBillingTarget = {}) =>
    apiRequest<{ status: "active" | "pending" }>(
      `billing/checkout/${encodeURIComponent(checkoutId)}/complete`,
      { body: target, authenticated: true },
    ),
  changePlan: (body: TPlanChoice) =>
    apiRequest("billing/change-plan", { body, authenticated: true }),
  cancel: (target: TBillingTarget = {}) =>
    apiRequest("billing/cancel", { body: target, authenticated: true }),
  resume: (target: TBillingTarget = {}) =>
    apiRequest("billing/resume", { body: target, authenticated: true }),
  /** A short-lived link to invoices and the payment method. */
  portal: (target: TBillingTarget = {}) =>
    apiRequest<{ url: string }>("billing/portal", {
      body: target,
      authenticated: true,
    }),
};
