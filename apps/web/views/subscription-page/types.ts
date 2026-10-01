import type { TPlanPeriod } from "@repo/cv-core";

export type TSubscriptionPageProps = {
  /** From `?period=` (e.g. the pricing page's choice), if valid. */
  initialPeriod?: TPlanPeriod;
  /**
   * A checkout Paddle sent the buyer here to finish (`?_ptxn=`, e.g. from
   * an email about updating their card); it opens by itself.
   */
  pendingCheckoutId?: string;
};
