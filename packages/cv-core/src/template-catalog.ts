/** Whether every plan can use a template, or only plans with `template.premium`. */
export type TTemplateTier = "FREE" | "PREMIUM";

/** Hidden templates can't be picked for a CV; CVs already on one keep it. */
export type TTemplateStatus = "PUBLISHED" | "HIDDEN";

/** A template as `GET /templates` lists it: published ones, in order. */
export type TPublicTemplate = {
  id: string;
  tier: TTemplateTier;
  category: string | null;
};

/** The ids of the templates a CV may pick, and those every plan includes. */
export type TTemplateCatalog = {
  available: readonly string[];
  free: readonly string[];
};

export const templateCatalogOf = (
  templates: readonly TPublicTemplate[],
): TTemplateCatalog => ({
  available: templates.map(({ id }) => id),
  free: templates.filter(({ tier }) => tier === "FREE").map(({ id }) => id),
});
