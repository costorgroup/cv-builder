import type {
  TTemplateRenderProps,
  TTemplateTypography,
} from "@/templates/types";

export type TDefaultTemplateColorKey =
  "background" | "text" | "sidebar" | "sidebarText" | "accent";

export type TDefaultTemplateColors = Record<TDefaultTemplateColorKey, string>;

export type TDefaultTemplateProps =
  TTemplateRenderProps<TDefaultTemplateColorKey>;

export type TSDefaultTemplateProps = {
  cvColors: TDefaultTemplateColors;
};

export type TSDefaultTemplateRootProps = TSDefaultTemplateProps & {
  typography: TTemplateTypography;
};

export type TSDefaultTemplateColumnProps = TSDefaultTemplateProps & {
  basis: number;
};
