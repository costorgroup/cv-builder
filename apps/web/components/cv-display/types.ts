import type { HTMLAttributes } from "react";
import type { TTemplateStep } from "@/templates/shared";

export type TCvDisplayVariant = "preview" | "static" | "print";

export type TCvDisplayProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * `preview`: pages with the resize sliders (the editor).
   * `static`: the same pages, read-only.
   * `print`: bare A4 pages with page breaks, for the PDF.
   */
  variant?: TCvDisplayVariant;
  /** Called with the page count once the page breaks have settled. */
  onReady?: (pages: number) => void;
  /** Shows only this page (0-based) instead of all of them. */
  page?: number;
  /**
   * Called with the editor step of a part of the CV that's clicked. When set,
   * hovering a part of the CV outlines it.
   */
  onStepSelect?: (step: TTemplateStep) => void;
};

export type TSCvDisplayVariantProps = {
  variant: TCvDisplayVariant;
};

export type TSCvDisplayPageProps = TSCvDisplayVariantProps & {
  /** Outlines the hovered part of the CV, to be clicked. */
  selectable: boolean;
};

export type TSCvDisplayDocumentProps = {
  /** How many pages high the document is. */
  pages: number;
  /** How many pages it is shifted up (the index of the page showing it). */
  offset: number;
};
