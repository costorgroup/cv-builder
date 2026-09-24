import type {
  TTemplateRenderProps,
  TTemplateTypography,
} from "@/templates/types";

export type TCreativeTemplateColorKey =
  "background" | "text" | "strip" | "stripText" | "accent";

export type TCreativeTemplateColors = Record<TCreativeTemplateColorKey, string>;

export type TCreativeTemplateProps =
  TTemplateRenderProps<TCreativeTemplateColorKey>;

export type TSCreativeTemplateProps = {
  cvColors: TCreativeTemplateColors;
};

export type TSCreativeTemplateRootProps = TSCreativeTemplateProps & {
  typography: TTemplateTypography;
};

export type TSCreativeTemplateColumnProps = TSCreativeTemplateProps & {
  basis: number;
};
