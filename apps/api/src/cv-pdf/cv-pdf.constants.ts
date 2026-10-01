/** Each PDF is a Chrome render, so they're limited well below other routes. */
export const PDF_THROTTLE = { default: { limit: 10, ttl: 60_000 } };
