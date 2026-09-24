import type {
  TTemplateRenderProps,
  TTemplateTypography,
} from "@/templates/types";

export type TBoldTemplateColorKey = "background" | "text" | "hero" | "heroText";

export type TBoldTemplateColors = Record<TBoldTemplateColorKey, string>;

export type TBoldTemplateProps = TTemplateRenderProps<TBoldTemplateColorKey>;

export type TSBoldTemplateProps = {
  cvColors: TBoldTemplateColors;
};

export type TSBoldTemplateRootProps = TSBoldTemplateProps & {
  typography: TTemplateTypography;
};

export type TSBoldTemplateRowProps = TSBoldTemplateProps & {
  basis: number;
};
