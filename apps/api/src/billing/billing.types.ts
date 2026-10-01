import type { SubscriptionStatus } from '../generated/prisma/client.js';

/** A subscription as the payment provider has it, in our terms. */
export type TProviderSubscription = {
  id: string;
  customerId: string;
  status: SubscriptionStatus;
  /** The provider's price the subscription is on. */
  priceId: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  /** Set to end at the close of the current period. */
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  trialEndsAt: Date | null;
  /** From the checkout we created: which organization it's for. */
  organizationId: string | null;
};

/** A plan and its prices, to publish in the provider's catalog. */
export type TCatalogPlan = {
  key: string;
  name: string;
  description: string | null;
  providerProductId: string | null;
  prices: {
    id: string;
    period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    amountCents: number;
    currency: string;
    providerPriceId: string | null;
  }[];
};

/** What the catalog sync created or found, to store on our rows. */
export type TCatalogSyncResult = {
  providerProductId: string;
  /** Our price row id → the provider's price id. */
  providerPriceIds: Record<string, string>;
};

/** A webhook, checked to come from the provider. */
export type TProviderEvent = {
  id: string;
  type: string;
  /** The subscription it's about, if any; re-read from the API to apply. */
  subscriptionId: string | null;
};

/**
 * What the app needs from a payment provider. Everything else (plans,
 * entitlements, subscriptions) works with our own records, so another
 * provider can be added by implementing this.
 */
export interface PaymentProvider {
  /** Stored on subscriptions, e.g. "paddle". */
  readonly name: string;
  /** Public settings the browser needs to open a checkout. */
  clientConfig(): Record<string, string>;
  /** Creates or updates the plan's product and prices. */
  syncCatalog(
    plan: TCatalogPlan,
    countryCurrencies: Record<string, string>,
  ): Promise<TCatalogSyncResult>;
  /** The customer for an email, created if there's none. */
  ensureCustomer(email: string, name: string): Promise<string>;
  /** A checkout for one price; `organizationId` travels with the payment. */
  createCheckout(input: {
    customerId: string;
    priceId: string;
    organizationId: string;
  }): Promise<{ checkoutId: string }>;
  /** The checkout's organization and, once paid, its subscription. */
  getCheckout(checkoutId: string): Promise<{
    organizationId: string | null;
    subscriptionId: string | null;
  }>;
  getSubscription(id: string): Promise<TProviderSubscription>;
  /** A customer's subscriptions that still give access. */
  listActiveSubscriptions(customerId: string): Promise<TProviderSubscription[]>;
  /** Moves to another price now, charging or crediting the difference. */
  changePrice(id: string, priceId: string): Promise<TProviderSubscription>;
  /** Ends the subscription when the current period is over. */
  cancelAtPeriodEnd(id: string): Promise<TProviderSubscription>;
  /** Undoes a cancellation that hasn't taken effect yet. */
  resume(id: string): Promise<TProviderSubscription>;
  /** A short-lived link to the provider's billing portal (invoices, card). */
  portalUrl(customerId: string, subscriptionId: string | null): Promise<string>;
  /** The event, if the signature is valid; null otherwise. */
  parseWebhook(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): TProviderEvent | null;
}

/**
 * The payment provider failed (it's down, or rejected a request). Shown to
 * users as "payments are unavailable"; the details go to the log.
 */
export class PaymentProviderError extends Error {}

/** Nest injection token for the configured provider. */
export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
