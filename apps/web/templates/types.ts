import type { ReactNode } from "react";

export type TTemplateDirection = "horizontal" | "vertical";

/** Section size in percent of its group. `min`/`max` default to 0/100. */
export type TTemplateSectionSize = {
  value: number;
  min?: number;
  max?: number;
};

export type TTemplateSection = {
  id: string;
  label: string;
  size: TTemplateSectionSize;
};

/**
 * Sections that share one axis. Their sizes always add up to 100%, so growing
 * one section shrinks its siblings (within their own min/max).
 */
export type TTemplateGroup = {
  id: string;
  label: string;
  direction: TTemplateDirection;
  sections: TTemplateSection[];
};

/** Current sizes, in percent: `sizes[groupId][sectionId]`. */
export type TTemplateSizes = Record<string, Record<string, number>>;

export type TTemplateColorScheme<TColorKey extends string = string> = {
  id: string;
  name: string;
  colors: Record<TColorKey, string>;
};

export type TTemplateTypography = {
  /** CSS `font-family` value. */
  fontFamily: string;
  /** Text size multiplier, 1 = the template default. */
  fontScale: number;
};

export type TTemplateRenderProps<TColorKey extends string = string> = {
  colors: Record<TColorKey, string>;
  sizes: TTemplateSizes;
  typography: TTemplateTypography;
};

export type TTemplate<TColorKey extends string = string> = {
  id: string;
  name: string;
  /** Font from `@/fonts` used until the user picks another one. */
  defaultFontId?: string;
  /** Predefined color schemes. The first one is the default. */
  colorSchemes: [
    TTemplateColorScheme<TColorKey>,
    ...TTemplateColorScheme<TColorKey>[],
  ];
  groups: TTemplateGroup[];
  render(props: TTemplateRenderProps<TColorKey>): ReactNode;
};
