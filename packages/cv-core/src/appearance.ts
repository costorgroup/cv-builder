import type { TCvAppearance } from "./cv.js";
import type { TFeature } from "./entitlements.js";
import { CV_FONTS } from "./fonts.js";
import { findTemplateSpec } from "./templates/index.js";
import { getDefaultSizes } from "./templates/sizes.js";
import type { TTemplateSizes, TTemplateSpec } from "./templates/types.js";

/** Text size multiplier range offered on the Appearance step. */
export const CV_FONT_SCALE = { min: 0.8, max: 1.2 } as const;

/** Allowed rounding error when checking sizes and the font scale. */
const EPSILON = 1e-6;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The template's default font; used until the user picks another one. */
export const defaultFontIdOf = (template: TTemplateSpec) =>
  CV_FONTS.find(({ id }) => id === template.defaultFontId)?.id ??
  CV_FONTS[0].id;

const normalizeSizes = (
  template: TTemplateSpec,
  sizes: unknown,
): TTemplateSizes | string => {
  const defaults = getDefaultSizes(template);
  if (sizes === undefined) return defaults;
  if (!isObject(sizes)) return "sizes must be an object";

  for (const groupId of Object.keys(sizes)) {
    if (!template.groups.some(({ id }) => id === groupId)) {
      return `unknown section group "${groupId}"`;
    }
  }
  const normalized: TTemplateSizes = {};
  for (const group of template.groups) {
    const given = sizes[group.id];
    if (given !== undefined && !isObject(given)) {
      return `sizes of "${group.id}" must be an object`;
    }
    const values: Record<string, number> = {};
    for (const section of group.sections) {
      const value = given?.[section.id] ?? defaults[group.id]?.[section.id];
      const min = section.size.min ?? 0;
      const max = section.size.max ?? 100;
      if (
        typeof value !== "number" ||
        value < min - EPSILON ||
        value > max + EPSILON
      ) {
        return `size of "${group.id}.${section.id}" must be ${min}–${max}`;
      }
      values[section.id] = value;
    }
    for (const sectionId of Object.keys(given ?? {})) {
      if (!(sectionId in values)) {
        return `unknown section "${group.id}.${sectionId}"`;
      }
    }
    const total = Object.values(values).reduce((sum, value) => sum + value, 0);
    if (Math.abs(total - 100) > 0.01) {
      return `sizes of "${group.id}" must add up to 100`;
    }
    normalized[group.id] = values;
  }
  return normalized;
};

/**
 * A complete, valid appearance from what a client sent (or an older saved
 * CV holds), or what's wrong with it. Missing fields get the template's
 * defaults, as the editor does; unknown fields are dropped.
 */
export const normalizeCvAppearance = (
  input: unknown,
): { appearance: TCvAppearance } | { error: string } => {
  if (!isObject(input)) return { error: "Appearance must be an object" };
  const { templateId, colorSchemeId, fontId, fontScale, sizes } = input;

  const template =
    typeof templateId === "string" ? findTemplateSpec(templateId) : undefined;
  if (!template) return { error: "Unknown template" };

  if (
    colorSchemeId !== undefined &&
    !template.colorSchemes.some(({ id }) => id === colorSchemeId)
  ) {
    return { error: "Unknown color scheme for this template" };
  }
  if (fontId !== undefined && !CV_FONTS.some(({ id }) => id === fontId)) {
    return { error: "Unknown font" };
  }
  if (
    fontScale !== undefined &&
    (typeof fontScale !== "number" ||
      fontScale < CV_FONT_SCALE.min - EPSILON ||
      fontScale > CV_FONT_SCALE.max + EPSILON)
  ) {
    return {
      error: `Text size must be ${CV_FONT_SCALE.min * 100}–${CV_FONT_SCALE.max * 100}%`,
    };
  }
  const normalizedSizes = normalizeSizes(template, sizes);
  if (typeof normalizedSizes === "string") {
    return { error: `Invalid section sizes: ${normalizedSizes}` };
  }

  return {
    appearance: {
      templateId: template.id,
      colorSchemeId: (colorSchemeId as string | undefined) ?? template.colorSchemes[0].id,
      fontId: (fontId as string | undefined) ?? defaultFontIdOf(template),
      fontScale: (fontScale as number | undefined) ?? 1,
      sizes: normalizedSizes,
    },
  };
};

/**
 * One premium part of an appearance: the feature it needs, when this
 * appearance uses it, and what identifies that use (so an unchanged one can
 * be kept after a downgrade).
 */
type TPremiumAspect = {
  feature: TFeature;
  uses: (
    appearance: TCvAppearance,
    template: TTemplateSpec,
    freeTemplateIds: readonly string[],
  ) => boolean;
  key: (appearance: TCvAppearance) => string;
};

const PREMIUM_ASPECTS: TPremiumAspect[] = [
  {
    feature: "template.premium",
    uses: ({ templateId }, _, freeTemplateIds) =>
      !freeTemplateIds.includes(templateId),
    key: ({ templateId }) => templateId,
  },
  {
    feature: "appearance.allColorSchemes",
    uses: ({ colorSchemeId }, template) =>
      colorSchemeId !== template.colorSchemes[0].id,
    key: ({ templateId, colorSchemeId }) => `${templateId}/${colorSchemeId}`,
  },
  {
    feature: "appearance.allFonts",
    uses: ({ fontId }, template) => fontId !== defaultFontIdOf(template),
    key: ({ templateId, fontId }) => `${templateId}/${fontId}`,
  },
  {
    feature: "appearance.resizeSections",
    uses: ({ sizes }, template) =>
      JSON.stringify(sizes) !== JSON.stringify(getDefaultSizes(template)),
    key: ({ templateId, sizes }) => `${templateId}/${JSON.stringify(sizes)}`,
  },
];

/**
 * Features a normalized appearance needs that `previous` (the CV as saved,
 * if any) didn't already use in the same way. So a CV made on a higher plan
 * keeps its look after a downgrade, but can't take on anything new.
 * `freeTemplateIds` are the templates every plan includes (the catalog's
 * `free`); any other template needs `template.premium`.
 */
export const premiumFeaturesNeeded = (
  next: TCvAppearance,
  previous: TCvAppearance | null,
  freeTemplateIds: readonly string[],
): TFeature[] => {
  const template = findTemplateSpec(next.templateId);
  if (!template) return [];
  const previousTemplate = previous && findTemplateSpec(previous.templateId);
  return PREMIUM_ASPECTS.filter(
    ({ uses, key }) =>
      uses(next, template, freeTemplateIds) &&
      !(
        previous &&
        previousTemplate &&
        uses(previous, previousTemplate, freeTemplateIds) &&
        key(previous) === key(next)
      ),
  ).map(({ feature }) => feature);
};
