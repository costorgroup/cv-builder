import type {
  TTemplateRenderProps,
  TTemplateTypography,
} from "@/templates/types";

export type TModernTemplateColorKey =
  "background" | "text" | "sidebar" | "sidebarText" | "accent";

export type TModernTemplateColors = Record<TModernTemplateColorKey, string>;

export type TModernTemplateProps =
  TTemplateRenderProps<TModernTemplateColorKey>;

export type TSModernTemplateProps = {
  cvColors: TModernTemplateColors;
};

export type TSModernTemplateRootProps = TSModernTemplateProps & {
  typography: TTemplateTypography;
};

export type TSModernTemplateColumnProps = TSModernTemplateProps & {
  basis: number;
};
