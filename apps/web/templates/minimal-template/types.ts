import type {
  TTemplateRenderProps,
  TTemplateTypography,
} from "@/templates/types";

export type TMinimalTemplateColorKey =
  "background" | "text" | "muted" | "accent";

export type TMinimalTemplateColors = Record<TMinimalTemplateColorKey, string>;

export type TMinimalTemplateProps =
  TTemplateRenderProps<TMinimalTemplateColorKey>;

export type TSMinimalTemplateProps = {
  cvColors: TMinimalTemplateColors;
};

export type TSMinimalTemplateRootProps = TSMinimalTemplateProps & {
  typography: TTemplateTypography;
};

export type TSMinimalTemplateRowsProps = {
  /** Where the label column ends, in percent of the page width. */
  labelsEnd: number;
};
