import type {
  TTemplateRenderProps,
  TTemplateTypography,
} from "@/templates/types";

export type TClassicTemplateColorKey = "background" | "text" | "accent";

export type TClassicTemplateColors = Record<TClassicTemplateColorKey, string>;

export type TClassicTemplateProps =
  TTemplateRenderProps<TClassicTemplateColorKey>;

export type TSClassicTemplateProps = {
  cvColors: TClassicTemplateColors;
};

export type TSClassicTemplateRootProps = TSClassicTemplateProps & {
  typography: TTemplateTypography;
};

export type TSClassicTemplateRowProps = TSClassicTemplateProps & {
  basis: number;
};
