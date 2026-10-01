import type { TFeature, TLimit, TLimitValue } from "@repo/cv-core";

/** Plan features as the pricing and subscription pages list them. */
export const FEATURE_LABELS: Record<TFeature, string> = {
  "cv.download.pdf": "Download as PDF",
  "template.premium": "All templates",
  "appearance.allColorSchemes": "Every color scheme",
  "appearance.allFonts": "Every font",
  "appearance.resizeSections": "Resize sections to fit your content",
  "cv.multiPage": "Multi-page CVs",
  "api.access": "API access",
  "embed.builder": "Embed the builder on your site",
  "embed.whitelabel": "Your own branding on the builder",
  "storage.external": "Use your own storage",
  "organization.team": "Team workspaces",
};

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

/**
 * A limit as a plan bullet, e.g. "1 saved CV" or "Unlimited saved CVs";
 * undefined for limits a plan doesn't need to mention (0, or not shown).
 */
export const limitLabel = (limit: TLimit, value: TLimitValue) => {
  if (value === 0) return undefined;
  switch (limit) {
    case "cv.max":
      return value === null
        ? "Unlimited saved CVs"
        : `${plural(value, "saved CV")}`;
    case "pdf.monthly":
      return value === null ? undefined : `${plural(value, "PDF")} a month`;
    default:
      return undefined;
  }
};

/** Plan limits as the admin area names them. */
export const LIMIT_LABELS: Record<TLimit, string> = {
  "cv.max": "Saved CVs",
  "storage.bytes": "Storage (bytes)",
  "pdf.monthly": "PDFs a month",
  "apiKey.max": "API keys",
  "api.requests.monthly": "API requests a month",
  "embed.max": "Embeds",
  "embed.externalUsers.max": "Embedded users",
  "org.members.max": "Team members",
};
