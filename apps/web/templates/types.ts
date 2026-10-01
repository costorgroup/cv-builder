import type { ReactNode } from "react";
import type { TTemplateSizes, TTemplateSpec } from "@repo/cv-core";

export type {
  TTemplateColorScheme,
  TTemplateDirection,
  TTemplateGroup,
  TTemplateSection,
  TTemplateSectionSize,
  TTemplateSizes,
  TTemplateSpec,
} from "@repo/cv-core";

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

/** A template's shared spec (from `@repo/cv-core`) plus how it renders. */
export type TTemplate<TColorKey extends string = string> =
  TTemplateSpec<TColorKey> & {
    render(props: TTemplateRenderProps<TColorKey>): ReactNode;
  };
