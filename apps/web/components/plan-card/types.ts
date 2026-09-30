import type { TBillingPeriod, TPlan } from "@/utils/pricing";

export type TPlanCardProps = {
  plan: TPlan;
  period: TBillingPeriod;
};

export type TSPlanCardProps = {
  highlighted?: boolean;
};
