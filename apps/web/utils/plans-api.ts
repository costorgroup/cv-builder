import type { TPublicPlans } from "@repo/cv-core";
import { apiRequest } from "@/utils/api-client";

export type {
  TPlanPeriod,
  TPublicPlan,
  TPublicPlanPrice,
  TPublicPlans,
} from "@repo/cv-core";

export const plansApi = {
  /**
   * Plans priced for this browser: the currency it picked (cookie), else its
   * country's; the API works that out from the request.
   */
  list: (signal?: AbortSignal) =>
    apiRequest<TPublicPlans>("plans", { method: "GET", signal }),
};
