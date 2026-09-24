import type { HTMLAttributes } from "react";

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
};

export type TSCvDisplayVariantProps = {
  variant: TCvDisplayVariant;
};

export type TSCvDisplayDocumentProps = {
  /** How many pages high the document is. */
  pages: number;
  /** How many pages it is shifted up (the index of the page showing it). */
  offset: number;
};
