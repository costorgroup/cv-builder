import type { ReactNode } from "react";
import type { TPlanRestriction } from "@/utils/plan-restriction";

export type TUpgradePromptProps = {
  restriction: TPlanRestriction;
  /** Another way out besides upgrading, e.g. "Reset sizes". */
  action?: ReactNode;
  /** Where "See plans" goes; the pricing page by default. */
  href?: string;
  className?: string;
  /**
   * For wide spots (e.g. the dashboard): an icon, the message and the
   * actions in one row, instead of the actions under the message.
   */
  wide?: boolean;
};
