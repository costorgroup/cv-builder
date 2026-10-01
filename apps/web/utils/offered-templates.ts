import type { TPublicTemplate, TTemplateTier } from "@repo/cv-core";
import { templates, type TTemplate } from "@/templates";

/** A template as it's offered: its look from code, its tier from the API. */
export type TOfferedTemplate = TTemplate & {
  tier: TTemplateTier;
  category: string | null;
};

/**
 * The published templates, in the API's order, with their look from code.
 * Ones the API lists that this build doesn't have are left out.
 */
export const offeredTemplates = (
  published: readonly TPublicTemplate[],
): TOfferedTemplate[] =>
  published.flatMap(({ id, tier, category }) => {
    const template = templates.find((each) => each.id === id);
    return template ? [{ ...template, tier, category }] : [];
  });

/**
 * Every template in code, all free: what's shown when the API can't be
 * reached. Nothing's locked then; the API still checks when saving.
 */
export const fallbackTemplates = (): TOfferedTemplate[] =>
  templates.map((template) => ({ ...template, tier: "FREE", category: null }));
