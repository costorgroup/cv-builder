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

/**
 * Everything about a template except how it renders: what the API needs to
 * check a CV's appearance, and what the web app's templates build on.
 */
export type TTemplateSpec<TColorKey extends string = string> = {
  id: string;
  name: string;
  /** Font from `CV_FONTS` used until the user picks another one. */
  defaultFontId?: string;
  /** Predefined color schemes. The first one is the default. */
  colorSchemes: [
    TTemplateColorScheme<TColorKey>,
    ...TTemplateColorScheme<TColorKey>[],
  ];
  groups: TTemplateGroup[];
};
