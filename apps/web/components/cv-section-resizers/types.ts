import type { HTMLAttributes } from "react";
import type { TTemplateDirection } from "@/templates/types";

export type TCvSectionResizersProps = HTMLAttributes<HTMLDivElement>;

export type TSCvSectionResizerProps = {
  /** The group's direction: horizontal groups are split by vertical lines. */
  axis: TTemplateDirection;
  /** Where the boundary is, in percent of the page. */
  position: number;
};
