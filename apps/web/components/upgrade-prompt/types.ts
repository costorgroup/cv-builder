import type { ReactNode } from "react";
import type { TPlanRestriction } from "@/utils/plan-restriction";

export type TUpgradePromptProps = {
  restriction: TPlanRestriction;
  /** Another way out besides upgrading, e.g. "Reset sizes". */
  action?: ReactNode;
  /** Where "See plans" goes; the pricing page by default. */
  href?: string;
  className?: string;
};
