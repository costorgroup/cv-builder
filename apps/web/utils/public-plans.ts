import { cookies, headers } from "next/headers";
import { CURRENCY_COOKIE, type TPublicPlans } from "@repo/cv-core";

/** The Nest API, reached directly from the server (as in next.config.js). */
const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

/**
 * Request headers the API works out the visitor's country from: CDN geo
 * headers and the browser's languages.
 */
const FORWARDED_HEADERS = [
  "accept-language",
  "cf-ipcountry",
  "x-vercel-ip-country",
  "cloudfront-viewer-country",
  ...(process.env.GEO_COUNTRY_HEADER ? [process.env.GEO_COUNTRY_HEADER] : []),
];

/**
 * The public plans priced for the visitor, for server-rendered pages; null
 * if the API can't be reached, so the page can say so instead of failing.
 * Reads the request, so pages using it render per visitor.
 */
export const getPublicPlans = async (): Promise<TPublicPlans | null> => {
  const [incoming, cookieStore] = await Promise.all([headers(), cookies()]);
  const forwarded = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = incoming.get(name);
    if (value) forwarded.set(name, value);
  }
  const currency = cookieStore.get(CURRENCY_COOKIE)?.value;
  const query = currency ? `?${new URLSearchParams({ currency })}` : "";

  try {
    const response = await fetch(`${API_URL}/plans${query}`, {
      headers: forwarded,
      // Prices depend on who's asking, so they're fetched every time.
      cache: "no-store",
    });
    return response.ok ? ((await response.json()) as TPublicPlans) : null;
  } catch {
    return null;
  }
};
