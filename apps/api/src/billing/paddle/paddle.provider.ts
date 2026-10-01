import { DEFAULT_CURRENCY } from '@repo/cv-core';
import {
  PaymentProviderError,
  type PaymentProvider,
  type TCatalogPlan,
  type TCatalogSyncResult,
  type TProviderSubscription,
} from '../billing.types.js';
import {
  fromPaddleSubscription,
  PADDLE_BILLING_CYCLES,
  PADDLE_CURRENCIES,
  parsePaddleWebhook,
} from './paddle.mapping.js';

/** An error from Paddle's API, with its error code (e.g. "not_found"). */
export class PaddleApiError extends PaymentProviderError {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
  ) {
    super(message);
  }
}

export type TPaddleConfig = {
  apiKey: string;
  /** For verifying webhooks; webhooks are refused without it. */
  webhookSecret?: string;
  /** Public token for Paddle.js in the browser. */
  clientToken?: string;
};

/**
 * Paddle Billing (https://developer.paddle.com). Sandbox or live follows the
 * API key: sandbox keys start with "pdl_sdbx_".
 */
export class PaddleProvider implements PaymentProvider {
  readonly name = 'paddle';
  readonly environment: 'sandbox' | 'production';
  private readonly baseUrl: string;

  constructor(private readonly config: TPaddleConfig) {
    this.environment = config.apiKey.startsWith('pdl_sdbx_')
      ? 'sandbox'
      : 'production';
    this.baseUrl =
      this.environment === 'sandbox'
        ? 'https://sandbox-api.paddle.com'
        : 'https://api.paddle.com';
  }

  clientConfig() {
    return {
      provider: this.name,
      environment: this.environment,
      clientToken: this.config.clientToken ?? '',
    };
  }

  async syncCatalog(
    plan: TCatalogPlan,
    countryCurrencies: Record<string, string>,
  ): Promise<TCatalogSyncResult> {
    const product = {
      name: plan.name,
      description: plan.description,
      tax_category: 'standard',
      custom_data: { planKey: plan.key },
    };
    const productId = plan.providerProductId
      ? (
          await this.request<{ id: string }>(
            'PATCH',
            `/products/${plan.providerProductId}`,
            product,
          )
        ).id
      : (await this.request<{ id: string }>('POST', '/products', product)).id;

    const providerPriceIds: Record<string, string> = {};
    for (const base of plan.prices.filter(
      (price) => price.currency === DEFAULT_CURRENCY,
    )) {
      // The same period's prices in other currencies Paddle can charge, for
      // the countries that use them.
      const overrides = plan.prices
        .filter(
          (price) =>
            price.period === base.period &&
            price.currency !== DEFAULT_CURRENCY &&
            PADDLE_CURRENCIES.has(price.currency),
        )
        .map((price) => ({
          country_codes: Object.entries(countryCurrencies)
            .filter(([, currency]) => currency === price.currency)
            .map(([country]) => country),
          unit_price: {
            amount: String(price.amountCents),
            currency_code: price.currency,
          },
        }))
        .filter(({ country_codes }) => country_codes.length > 0);

      const body = {
        description: `${plan.name} (${base.period.toLowerCase()})`,
        name: `${plan.name}, ${base.period.toLowerCase()}`,
        unit_price_overrides: overrides,
        // One subscription per account: the buyer can't change the quantity.
        quantity: { minimum: 1, maximum: 1 },
      };
      providerPriceIds[base.id] = base.providerPriceId
        ? (
            await this.request<{ id: string }>(
              'PATCH',
              `/prices/${base.providerPriceId}`,
              body,
            )
          ).id
        : (
            await this.request<{ id: string }>('POST', '/prices', {
              ...body,
              product_id: productId,
              unit_price: {
                amount: String(base.amountCents),
                currency_code: base.currency,
              },
              billing_cycle: PADDLE_BILLING_CYCLES[base.period],
              custom_data: { planPriceId: base.id },
            })
          ).id;
    }
    return { providerProductId: productId, providerPriceIds };
  }

  async ensureCustomer(email: string, name: string) {
    try {
      return (
        await this.request<{ id: string }>('POST', '/customers', {
          email,
          name,
        })
      ).id;
    } catch (error) {
      if (!(error instanceof PaddleApiError) || error.status !== 409)
        throw error;
      // Already a customer (e.g. from an earlier checkout): look them up.
      const found = await this.request<{ id: string }[]>(
        'GET',
        `/customers?email=${encodeURIComponent(email)}`,
      );
      if (!found[0]) throw error;
      return found[0].id;
    }
  }

  async createCheckout({
    customerId,
    priceId,
    organizationId,
  }: {
    customerId: string;
    priceId: string;
    organizationId: string;
  }) {
    const transaction = await this.request<{ id: string }>(
      'POST',
      '/transactions',
      {
        items: [{ price_id: priceId, quantity: 1 }],
        customer_id: customerId,
        collection_mode: 'automatic',
        custom_data: { organizationId },
      },
    );
    return { checkoutId: transaction.id };
  }

  async getCheckout(checkoutId: string) {
    const transaction = await this.request<{
      subscription_id: string | null;
      custom_data: Record<string, unknown> | null;
    }>('GET', `/transactions/${encodeURIComponent(checkoutId)}`);
    const organizationId = transaction.custom_data?.organizationId;
    return {
      organizationId:
        typeof organizationId === 'string' ? organizationId : null,
      subscriptionId: transaction.subscription_id,
    };
  }

  async getSubscription(id: string) {
    return fromPaddleSubscription(
      await this.request('GET', `/subscriptions/${encodeURIComponent(id)}`),
    );
  }

  async listActiveSubscriptions(customerId: string) {
    const subscriptions = await this.request<
      Parameters<typeof fromPaddleSubscription>[0][]
    >(
      'GET',
      `/subscriptions?customer_id=${encodeURIComponent(customerId)}&status=active,trialing,past_due`,
    );
    return subscriptions.map(fromPaddleSubscription);
  }

  async changePrice(
    id: string,
    priceId: string,
  ): Promise<TProviderSubscription> {
    return fromPaddleSubscription(
      await this.request('PATCH', `/subscriptions/${encodeURIComponent(id)}`, {
        items: [{ price_id: priceId, quantity: 1 }],
        proration_billing_mode: 'prorated_immediately',
      }),
    );
  }

  async cancelAtPeriodEnd(id: string) {
    return fromPaddleSubscription(
      await this.request(
        'POST',
        `/subscriptions/${encodeURIComponent(id)}/cancel`,
        {
          effective_from: 'next_billing_period',
        },
      ),
    );
  }

  async resume(id: string) {
    return fromPaddleSubscription(
      await this.request('PATCH', `/subscriptions/${encodeURIComponent(id)}`, {
        scheduled_change: null,
      }),
    );
  }

  async portalUrl(customerId: string, subscriptionId: string | null) {
    const session = await this.request<{
      urls: { general: { overview: string } };
    }>(
      'POST',
      `/customers/${encodeURIComponent(customerId)}/portal-sessions`,
      subscriptionId ? { subscription_ids: [subscriptionId] } : {},
    );
    return session.urls.general.overview;
  }

  /**
   * A client-side token for Paddle.js, created if there's no active one.
   * These are public by design: they can only open checkouts.
   */
  async ensureClientToken(name: string) {
    const tokens = await this.request<{ token: string; status: string }[]>(
      'GET',
      '/client-tokens',
    );
    const active = tokens.find(({ status }) => status === 'active');
    if (active) return active.token;
    return (
      await this.request<{ token: string }>('POST', '/client-tokens', { name })
    ).token;
  }

  parseWebhook(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ) {
    if (!this.config.webhookSecret) return null;
    return parsePaddleWebhook(rawBody, headers, this.config.webhookSecret);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'Paddle-Version': '1',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await response.json().catch(() => ({}))) as {
      data?: T;
      error?: { code?: string; detail?: string };
    };
    if (!response.ok) {
      throw new PaddleApiError(
        response.status,
        json.error?.code,
        `Paddle ${method} ${path.split('?')[0]} failed (${response.status}): ${json.error?.detail ?? json.error?.code ?? 'no details'}`,
      );
    }
    return json.data as T;
  }
}
