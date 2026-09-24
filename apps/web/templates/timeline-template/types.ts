import type {
  TTemplateRenderProps,
  TTemplateTypography,
} from "@/templates/types";

export type TTimelineTemplateColorKey =
  "background" | "text" | "header" | "headerText" | "accent" | "line";

export type TTimelineTemplateColors = Record<TTimelineTemplateColorKey, string>;

export type TTimelineTemplateProps =
  TTemplateRenderProps<TTimelineTemplateColorKey>;

export type TSTimelineTemplateProps = {
  cvColors: TTimelineTemplateColors;
};

export type TSTimelineTemplateRootProps = TSTimelineTemplateProps & {
  typography: TTemplateTypography;
};

export type TSTimelineTemplateRowProps = TSTimelineTemplateProps & {
  basis: number;
};
