import type { HTMLAttributes } from "react";
import type { TTemplateDirection } from "@/templates/types";

export type TCvSectionResizersProps = HTMLAttributes<HTMLDivElement>;

export type TSCvSectionResizerProps = {
  axis: TTemplateDirection;
  /** Where the slider starts, in percent of the page. */
  start: number;
  /** How long the slider is, in percent of the page. */
  length: number;
};
