import type { ReactNode } from "react";
import type { TUsage } from "@repo/cv-core";

export type TUsageMeterProps = {
  label: string;
  usage: TUsage;
  /** Shows the numbers, e.g. as bytes; plain numbers by default. */
  format?: (value: number) => string;
  /** A line under the bar, e.g. when the count starts over. */
  detail?: ReactNode;
};
