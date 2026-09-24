import type {
  TTemplateRenderProps,
  TTemplateTypography,
} from "@/templates/types";

export type TExecutiveTemplateColorKey =
  "background" | "text" | "header" | "headerText" | "aside" | "accent";

export type TExecutiveTemplateColors = Record<
  TExecutiveTemplateColorKey,
  string
>;

export type TExecutiveTemplateProps =
  TTemplateRenderProps<TExecutiveTemplateColorKey>;

export type TSExecutiveTemplateProps = {
  cvColors: TExecutiveTemplateColors;
};

export type TSExecutiveTemplateRootProps = TSExecutiveTemplateProps & {
  typography: TTemplateTypography;
};

export type TSExecutiveTemplateSectionProps = TSExecutiveTemplateProps & {
  basis: number;
};
