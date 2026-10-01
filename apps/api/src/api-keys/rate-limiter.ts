/**
 * Requests per key per minute, counted in this process. Enough for one API
 * instance; with several, they need a shared store (Redis), or each allows
 * this many on its own.
 */
export class RateLimiter {
  private readonly windows = new Map<
    string,
    { start: number; count: number }
  >();

  constructor(
    readonly limit: number,
    private readonly windowMs = 60_000,
  ) {}

  /**
   * Counts a request; returns how long to wait in seconds if it's over the
   * limit, or 0 if it may go ahead.
   */
  hit(key: string, now = Date.now()) {
    const window = this.windows.get(key);
    if (!window || now - window.start >= this.windowMs) {
      this.windows.set(key, { start: now, count: 1 });
      this.sweep(now);
      return 0;
    }
    window.count++;
    return window.count > this.limit
      ? Math.ceil((window.start + this.windowMs - now) / 1000)
      : 0;
  }

  /** Forgets windows that ended, so idle keys don't pile up. */
  private sweep(now: number) {
    if (this.windows.size < 10_000) return;
    for (const [key, window] of this.windows) {
      if (now - window.start >= this.windowMs) this.windows.delete(key);
    }
  }
}
