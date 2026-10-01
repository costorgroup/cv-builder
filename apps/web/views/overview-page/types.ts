import type { ReactNode } from "react";
import type { TUsage } from "@repo/cv-core";

export type TOverviewPageStatProps = {
  label: string;
  /** The headline, e.g. the plan's name or "2 / 5". */
  value: ReactNode;
  /** A line under the value, e.g. when the plan renews. */
  detail?: ReactNode;
  /** Draws a bar for how much of a limit is used. */
  usage?: TUsage;
  action?: ReactNode;
};
