"use client";

import { Alert, Button, Small } from "@costor/ui";
import { defaultFontIdOf, type TFeature } from "@repo/cv-core";
import ButtonLink from "@/components/button-link";
import {
  SLockedFeaturesNoticeItem,
  SLockedFeaturesNoticeList,
} from "@/components/locked-features-notice/styles";
import type { TLockedFeaturesNoticeProps } from "@/components/locked-features-notice/types";
import { findCvFont } from "@/fonts";
import { useCvEditorEnv } from "@/providers/cv-editor-env";
import { useCv } from "@/providers/cv-provider/context";
import { useLockedFeatures } from "@/utils/locked-features";
import { PRICING_PATH } from "@/utils/site";
import { useTemplateCatalog } from "@/utils/template-catalog";

/**
 * One warning listing every premium option the CV uses that the plan
 * doesn't include (of `features`, if given), with one button back to what
 * the plan has; nothing when there are none. Needs a CvProvider and an
 * EntitlementsProvider above it.
 */
export const LockedFeaturesNotice = ({
  features,
  className,
}: TLockedFeaturesNoticeProps) => {
  const cv = useCv();
  const { showUpgrades = true } = useCvEditorEnv();
  const catalog = useTemplateCatalog();
  const locked = useLockedFeatures().filter(
    (feature) => !features || features.includes(feature),
  );
  if (locked.length === 0) return null;

  const { template } = cv;
  const freeTemplateId =
    catalog.status === "loading" ? undefined : catalog.free[0];
  const scheme = template.colorSchemes.find(
    ({ id }) => id === cv.colorSchemeId,
  );

  /** What each option is, as the list shows it. */
  const labelOf = (feature: TFeature) => {
    switch (feature) {
      case "template.premium":
        return `The ${template.name} template`;
      case "appearance.allColorSchemes":
        return `The ${scheme?.name ?? "chosen"} color scheme`;
      case "appearance.allFonts":
        return `The ${findCvFont(cv.fontId).name} font`;
      case "appearance.resizeSections":
        return "Resized sections";
      default:
        return "A Premium option";
    }
  };

  /**
   * Back to what the plan includes. A free template brings its own default
   * colors, font and sizes; otherwise only the locked options are reset, so
   * anything the saved CV may keep stays.
   */
  const switchToFree = () => {
    if (locked.includes("template.premium")) {
      if (freeTemplateId) cv.setTemplateId(freeTemplateId);
      return;
    }
    if (locked.includes("appearance.allColorSchemes")) {
      cv.setColorSchemeId(template.colorSchemes[0].id);
    }
    if (locked.includes("appearance.allFonts")) {
      cv.setFontId(defaultFontIdOf(template));
    }
    if (locked.includes("appearance.resizeSections")) cv.resetSectionSizes();
  };
  const canSwitchToFree =
    !locked.includes("template.premium") || !!freeTemplateId;

  return (
    <Alert
      className={className}
      color="warning"
      variant="subtle"
      size="sm"
      title={
        locked.length === 1
          ? "Your CV uses a Premium option"
          : `Your CV uses ${locked.length} Premium options`
      }
      actions={
        <>
          <Button
            size="sm"
            variant="plain"
            color="warning"
            disabled={!canSwitchToFree}
            onClick={switchToFree}
          >
            Use free instead
          </Button>
          {showUpgrades && (
            <Button
              as={ButtonLink}
              href={PRICING_PATH}
              size="sm"
              variant="solid"
              color="warning"
            >
              See plans
            </Button>
          )}
        </>
      }
    >
      {showUpgrades ? "Your plan" : "This builder"} doesn&apos;t include{" "}
      {locked.length === 1 ? "it" : "them"}.{" "}
      {showUpgrades
        ? "Upgrade to save or download the CV as it looks now, or use the free options instead:"
        : "Use the included options instead to save or download the CV:"}
      <SLockedFeaturesNoticeList>
        {locked.map((feature) => (
          <SLockedFeaturesNoticeItem key={feature}>
            <Small>{labelOf(feature)}</Small>
          </SLockedFeaturesNoticeItem>
        ))}
      </SLockedFeaturesNoticeList>
    </Alert>
  );
};

export default LockedFeaturesNotice;
