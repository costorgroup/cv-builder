import type { TPublicPlanPrice } from '@repo/cv-core';
import { pickCurrency, pickPrices } from './plans.service.js';
import {
  countryFromAcceptLanguage,
  countryFromHeaders,
} from './visitor-country.js';

const eur = (period: TPublicPlanPrice['period'], amountCents: number) =>
  ({ period, amountCents, currency: 'EUR' }) as const;
const usd = (period: TPublicPlanPrice['period'], amountCents: number) =>
  ({ period, amountCents, currency: 'USD' }) as const;

describe('pickPrices', () => {
  const prices = [
    eur('YEARLY', 7999),
    eur('MONTHLY', 999),
    usd('MONTHLY', 1099),
  ];

  it('uses only the chosen currency when the plan has prices in it', () => {
    // No yearly USD price: yearly is left out rather than shown in EUR.
    expect(pickPrices(prices, 'USD')).toEqual([usd('MONTHLY', 1099)]);
  });

  it('falls back to the default currency, in period order', () => {
    expect(pickPrices(prices, 'GBP')).toEqual([
      eur('MONTHLY', 999),
      eur('YEARLY', 7999),
    ]);
  });

  it('has no prices when there are none in either', () => {
    expect(pickPrices([usd('QUARTERLY', 2999)], 'GBP')).toEqual([]);
  });
});

describe('pickCurrency', () => {
  const available = new Set(['EUR', 'USD']);

  it("prefers the requested currency, then the country's, then the default", () => {
    expect(pickCurrency(available, 'USD', 'EUR')).toBe('USD');
    expect(pickCurrency(available, undefined, 'USD')).toBe('USD');
    expect(pickCurrency(available, 'GBP', 'USD')).toBe('USD');
    expect(pickCurrency(available, 'GBP', 'RSD')).toBe('EUR');
    expect(pickCurrency(available, undefined, null)).toBe('EUR');
  });
});

describe('countryFromAcceptLanguage', () => {
  it.each([
    ['sr-RS,sr;q=0.9,en;q=0.8', 'RS'],
    ['sr-Latn-RS', 'RS'],
    ['en;q=0.9,de-AT;q=0.8', 'AT'],
    ['de;q=0.5,en-GB;q=0.9', 'GB'],
    ['en', undefined],
    ['', undefined],
    [undefined, undefined],
  ])('%s → %s', (header, country) => {
    expect(countryFromAcceptLanguage(header)).toBe(country);
  });
});

describe('countryFromHeaders', () => {
  it('prefers a CDN geo header over the browser language', () => {
    expect(
      countryFromHeaders({ 'cf-ipcountry': 'rs', 'accept-language': 'en-US' }),
    ).toBe('RS');
  });

  it("ignores the CDN's unknown marker", () => {
    expect(
      countryFromHeaders({ 'cf-ipcountry': 'XX', 'accept-language': 'de-DE' }),
    ).toBe('DE');
  });
});
