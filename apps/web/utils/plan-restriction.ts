import {
  isFeature,
  isLimit,
  PLAN_FEATURE_REQUIRED,
  PLAN_LIMIT_REACHED,
  type TFeature,
  type TLimit,
} from "@repo/cv-core";
import { ApiError } from "@/utils/api-client";

/** Something the user's plan doesn't allow: a feature, or a used-up limit. */
export type TPlanRestriction =
  | { kind: "feature"; feature: TFeature }
  | { kind: "limit"; limit: TLimit; used: number; max: number };

/** The plan refusal behind an API error, if that's what it was. */
export const planRestrictionOf = (
  error: unknown,
): TPlanRestriction | undefined => {
  if (!(error instanceof ApiError) || error.status !== 403) return undefined;
  const { code, feature, limit, used, max } = error.body;
  if (code === PLAN_FEATURE_REQUIRED && isFeature(feature)) {
    return { kind: "feature", feature };
  }
  if (
    code === PLAN_LIMIT_REACHED &&
    isLimit(limit) &&
    typeof used === "number" &&
    typeof max === "number"
  ) {
    return { kind: "limit", limit, used, max };
  }
  return undefined;
};

const FEATURE_TEXT: Partial<Record<TFeature, [string, string]>> = {
  "template.premium": [
    "Premium template",
    "This template is part of Premium. Upgrade to save or download a CV with it, or pick one of the free templates.",
  ],
  "appearance.allColorSchemes": [
    "Premium color scheme",
    "Every color scheme is part of Premium. Upgrade to use this one, or go back to the template's first color scheme.",
  ],
  "appearance.allFonts": [
    "Premium font",
    "Every font is part of Premium. Upgrade to use this one, or go back to the template's default font.",
  ],
  "appearance.resizeSections": [
    "Resized sections",
    "Resizing sections is part of Premium. Upgrade to keep these sizes, or reset them to the template's.",
  ],
  "cv.download.pdf": [
    "PDF downloads",
    "Your plan doesn't include PDF downloads. Upgrade to download your CV.",
  ],
  "embed.builder": [
    "Embedding",
    "This plan doesn't include putting the CV builder on your own site. Upgrade to make an embed.",
  ],
  "embed.whitelabel": [
    "Your own branding",
    'Hiding "Made with CV Builder" needs a plan with white-label embeds.',
  ],
  "storage.external": [
    "Your own storage",
    "Keeping files in your own bucket needs a plan with external storage.",
  ],
  "api.access": [
    "API access",
    "This plan doesn't include the API. Upgrade to make API keys and connect your own apps.",
  ],
  "organization.team": [
    "Team members",
    "This team's plan doesn't include inviting people. Its owner can upgrade the team to add members.",
  ],
};

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

/** A short title and an explanation of what to do, for the user. */
export const planRestrictionText = (
  restriction: TPlanRestriction,
): { title: string; description: string } => {
  if (restriction.kind === "feature") {
    const [title, description] = FEATURE_TEXT[restriction.feature] ?? [
      "Not in your plan",
      "Your plan doesn't include this. Upgrade to use it.",
    ];
    return { title, description };
  }
  const { limit, used, max } = restriction;
  switch (limit) {
    case "cv.max":
      return {
        title: "You've reached your CV limit",
        description: `Your plan allows ${plural(max, "CV")} and you have ${used}. Delete a CV or upgrade to create more.`,
      };
    case "pdf.monthly":
      return {
        title: "Monthly PDF limit reached",
        description: `You've made ${plural(used, "PDF")} this month; your plan allows ${max}. Upgrade to make more, or wait until next month.`,
      };
    case "apiKey.max":
      return {
        title: "API key limit reached",
        description: `The plan allows ${plural(max, "API key")}. Revoke one you don't use, or upgrade.`,
      };
    case "embed.max":
      return {
        title: "Embed limit reached",
        description: `The plan allows ${plural(max, "embed")}. Delete one you don't use, or upgrade.`,
      };
    case "embed.externalUsers.max":
      return {
        title: "Embedded users limit reached",
        description: `The plan allows ${max} ${max === 1 ? "person" : "people"} using your embeds. Upgrade to let more in.`,
      };
    case "org.members.max":
      return {
        title: "The team is full",
        description: `The team's plan allows ${plural(max, "member")} besides the owner, and ${used} are in or invited. Remove someone, cancel an invite or upgrade the team.`,
      };
    default:
      return {
        title: "Plan limit reached",
        description:
          "You've used everything your plan allows here. Upgrade to get more.",
      };
  }
};
