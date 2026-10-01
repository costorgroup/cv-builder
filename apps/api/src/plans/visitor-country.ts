import type { IncomingHttpHeaders } from 'node:http';

/**
 * Headers hosting platforms and CDNs put the visitor's country in. Set
 * `GEO_COUNTRY_HEADER` to use just the one yours sends. They only choose
 * which currency prices are shown in, so a spoofed one does no harm.
 */
const GEO_HEADERS = process.env.GEO_COUNTRY_HEADER
  ? [process.env.GEO_COUNTRY_HEADER.toLowerCase()]
  : ['cf-ipcountry', 'x-vercel-ip-country', 'cloudfront-viewer-country'];

const COUNTRY_CODE = /^[A-Za-z]{2}$/;

/** "Unknown" and "Tor" markers some CDNs send instead of a country. */
const NOT_A_COUNTRY = new Set(['XX', 'T1']);

const headerValue = (headers: IncomingHttpHeaders, name: string) => {
  const value = headers[name];
  return Array.isArray(value) ? value[0] : value;
};

/**
 * The region of the most preferred language that names one, e.g. "RS" from
 * "sr-Latn-RS,sr;q=0.9,en;q=0.8".
 */
export const countryFromAcceptLanguage = (header: string | undefined) => {
  if (!header) return undefined;
  const tags = header
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params
        .map((param) => param.trim())
        .find((param) => param.startsWith('q='));
      return { tag, q: q ? Number(q.slice(2)) || 0 : 1, index };
    })
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const { tag } of tags) {
    // The region is the first two-letter subtag after the language.
    const region = tag
      .split('-')
      .slice(1)
      .find((subtag) => COUNTRY_CODE.test(subtag));
    if (region) return region.toUpperCase();
  }
  return undefined;
};

/** The visitor's country: from a geo header, else their browser language. */
export const countryFromHeaders = (headers: IncomingHttpHeaders) => {
  for (const name of GEO_HEADERS) {
    const value = headerValue(headers, name)?.trim().toUpperCase();
    if (value && COUNTRY_CODE.test(value) && !NOT_A_COUNTRY.has(value)) {
      return value;
    }
  }
  return countryFromAcceptLanguage(headerValue(headers, 'accept-language'));
};
