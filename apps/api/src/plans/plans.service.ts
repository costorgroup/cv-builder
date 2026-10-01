import { Injectable } from '@nestjs/common';
import {
  DEFAULT_CURRENCY,
  type TPlanPeriod,
  type TPublicPlanPrice,
  type TPublicPlans,
} from '@repo/cv-core';
import { PrismaService } from '../prisma/prisma.service.js';
import { TemplatesService } from '../templates/templates.service.js';
import { ExchangeRateService } from './exchange-rates.service.js';

const PERIOD_ORDER: TPlanPeriod[] = ['MONTHLY', 'QUARTERLY', 'YEARLY'];

/**
 * A plan's prices, one per period, all in one currency: `currency` if the
 * plan has any price in it, the default currency otherwise. Never mixed, so
 * periods can be compared (e.g. "save 33%").
 */
export const pickPrices = (
  prices: TPublicPlanPrice[],
  currency: string,
): TPublicPlanPrice[] => {
  const shown = prices.some((price) => price.currency === currency)
    ? currency
    : DEFAULT_CURRENCY;
  return PERIOD_ORDER.flatMap((period) =>
    prices.filter(
      (price) => price.period === period && price.currency === shown,
    ),
  );
};

/**
 * The currency to show: the one asked for, else the country's, as long as
 * there are prices in it; the default otherwise.
 */
export const pickCurrency = (
  available: ReadonlySet<string>,
  requested: string | undefined,
  countryCurrency: string | null | undefined,
) =>
  [requested, countryCurrency].find(
    (currency): currency is string => !!currency && available.has(currency),
  ) ?? DEFAULT_CURRENCY;

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exchangeRates: ExchangeRateService,
    private readonly templates: TemplatesService,
  ) {}

  /**
   * Plans for the pricing page, in their set order, with the prices they're
   * sold at now in the visitor's currency. Provider ids and archived plans
   * stay private.
   */
  async listPublic({
    currency,
    country,
  }: {
    currency?: string;
    country?: string;
  }): Promise<TPublicPlans> {
    const [plans, countryRow, catalog] = await Promise.all([
      this.prisma.plan.findMany({
        where: { isPublic: true, archivedAt: null },
        orderBy: { sortOrder: 'asc' },
        include: { prices: { where: { active: true } } },
      }),
      country
        ? this.prisma.country.findUnique({
            where: { code: country },
            select: { currency: true },
          })
        : null,
      this.templates.catalog(),
    ]);

    const available = new Set([
      DEFAULT_CURRENCY,
      ...plans.flatMap(({ prices }) => prices.map((price) => price.currency)),
    ]);
    const chosen = pickCurrency(available, currency, countryRow?.currency);
    // Visitors from Serbia see approximate dinars: prices can't be in RSD.
    const rsd =
      countryRow?.currency === 'RSD'
        ? await this.exchangeRates.rsdPer(chosen)
        : null;

    return {
      currency: chosen,
      approximate: rsd && {
        currency: 'RSD',
        ...rsd,
        source: 'National Bank of Serbia',
      },
      currencies: [...available].sort(),
      plans: plans.map(
        ({ key, name, description, features, limits, prices }) => ({
          key,
          name,
          description,
          features,
          limits: limits as TPublicPlans['plans'][number]['limits'],
          prices: pickPrices(
            prices.map(({ period, amountCents, currency: priceCurrency }) => ({
              period,
              amountCents,
              currency: priceCurrency,
            })),
            chosen,
          ),
        }),
      ),
      freeTemplateCount: catalog.free.length,
    };
  }

  /** The plan for anyone without another one; the migration seeds it. */
  getDefault() {
    return this.prisma.plan.findFirstOrThrow({ where: { isDefault: true } });
  }
}
