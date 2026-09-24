import type {
  TTemplateRenderProps,
  TTemplateTypography,
} from "@/templates/types";

export type TTechTemplateColorKey =
  "background" | "text" | "sidebar" | "muted" | "accent";

export type TTechTemplateColors = Record<TTechTemplateColorKey, string>;

export type TTechTemplateProps = TTemplateRenderProps<TTechTemplateColorKey>;

export type TSTechTemplateProps = {
  cvColors: TTechTemplateColors;
};

export type TSTechTemplateRootProps = TSTechTemplateProps & {
  typography: TTemplateTypography;
};

export type TSTechTemplateColumnProps = TSTechTemplateProps & {
  basis: number;
};
