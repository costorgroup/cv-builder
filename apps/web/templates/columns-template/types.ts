import type {
  TTemplateRenderProps,
  TTemplateTypography,
} from "@/templates/types";

export type TColumnsTemplateColorKey =
  "background" | "text" | "header" | "headerText" | "accent";

export type TColumnsTemplateColors = Record<TColumnsTemplateColorKey, string>;

export type TColumnsTemplateProps =
  TTemplateRenderProps<TColumnsTemplateColorKey>;

export type TSColumnsTemplateProps = {
  cvColors: TColumnsTemplateColors;
};

export type TSColumnsTemplateRootProps = TSColumnsTemplateProps & {
  typography: TTemplateTypography;
};

export type TSColumnsTemplateColumnProps = TSColumnsTemplateProps & {
  basis: number;
};
