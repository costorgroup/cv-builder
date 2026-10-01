import type { TPublicPlans } from "@/utils/plans-api";

export type TPricingPageProps = {
  /** From the API; null if it couldn't be reached. */
  plans: TPublicPlans | null;
};
