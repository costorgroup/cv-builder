import type { HTMLAttributes } from "react";
import type { TTemplate } from "@/templates/types";

export type TTemplatePreviewProps = HTMLAttributes<HTMLDivElement> & {
  template: TTemplate;
  /** Which of the template's color schemes to show; the default one if unset. */
  colorSchemeIndex?: number;
};
