import type {
  TTemplateRenderProps,
  TTemplateTypography,
} from "@/templates/types";

export type TElegantTemplateColorKey =
  "background" | "text" | "accent" | "frame";

export type TElegantTemplateColors = Record<TElegantTemplateColorKey, string>;

export type TElegantTemplateProps =
  TTemplateRenderProps<TElegantTemplateColorKey>;

export type TSElegantTemplateProps = {
  cvColors: TElegantTemplateColors;
};

export type TSElegantTemplateRootProps = TSElegantTemplateProps & {
  typography: TTemplateTypography;
};

export type TSElegantTemplateRowProps = TSElegantTemplateProps & {
  basis: number;
};
