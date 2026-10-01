import { Injectable, Logger } from '@nestjs/common';

/**
 * The National Bank of Serbia's daily rate list, as JSON. kurs.resenje.org
 * republishes it; set `NBS_RATES_URL` to use another source with the same
 * shape (`{currency}` is replaced by e.g. "eur").
 */
const NBS_RATES_URL =
  process.env.NBS_RATES_URL ??
  'https://kurs.resenje.org/api/v1/currencies/{currency}/rates/today';

/** Rates change once a day; this keeps requests to the source rare. */
const CACHE_MS = 12 * 60 * 60 * 1000;
const TIMEOUT_MS = 3000;

export type TExchangeRate = {
  /** Dinars per one unit of the other currency. */
  rate: number;
  /** The day the rate list is for, e.g. "2026-09-30". */
  date: string;
};

/**
 * Official middle rates to the Serbian dinar, for showing approximate RSD
 * amounts next to prices charged in another currency. Never used to charge.
 */
@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  private readonly cache = new Map<
    string,
    TExchangeRate & { fetchedAt: number }
  >();

  /** Dinars per unit of `currency`; the last known rate if the source fails. */
  async rsdPer(currency: string): Promise<TExchangeRate | null> {
    const key = currency.toUpperCase();
    if (key === 'RSD') return null;
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.fetchedAt < CACHE_MS) return cached;

    try {
      const response = await fetch(
        NBS_RATES_URL.replace('{currency}', key.toLowerCase()),
        { signal: AbortSignal.timeout(TIMEOUT_MS) },
      );
      const body = (await response.json()) as {
        exchange_middle?: unknown;
        parity?: unknown;
        date?: unknown;
      };
      const middle = Number(body.exchange_middle);
      // Some currencies are quoted per 100 units.
      const parity = Number(body.parity) || 1;
      if (!response.ok || !(middle > 0) || typeof body.date !== 'string') {
        throw new Error(`unexpected response (${response.status})`);
      }
      const rate = { rate: middle / parity, date: body.date };
      this.cache.set(key, { ...rate, fetchedAt: Date.now() });
      return rate;
    } catch (error) {
      this.logger.warn(
        `No RSD rate for ${key}: ${error instanceof Error ? error.message : error}`,
      );
      return cached ?? null;
    }
  }
}
