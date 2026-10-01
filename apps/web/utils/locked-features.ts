"use client";

import { useMemo } from "react";
import {
  normalizeCvAppearance,
  premiumFeaturesNeeded,
  type TFeature,
} from "@repo/cv-core";
import { useCv } from "@/providers/cv-provider/context";
import { useEntitlements } from "@/providers/entitlements-provider";
import { useTemplateCatalog } from "@/utils/template-catalog";

/**
 * Premium features the editor's current appearance needs that the plan
 * doesn't have, by the same rule the API applies when saving: options the
 * saved CV already used can stay. Empty when nothing stands in the way, and
 * until the templates on offer have loaded.
 * Needs a CvProvider and an EntitlementsProvider above it.
 */
export const useLockedFeatures = (): TFeature[] => {
  const { appearance, savedAppearance } = useCv();
  const { can } = useEntitlements();
  const catalog = useTemplateCatalog();
  const free = catalog.status === "loading" ? undefined : catalog.free;

  return useMemo(() => {
    if (!free) return [];
    const result = normalizeCvAppearance(appearance);
    if (!("appearance" in result)) return [];
    return premiumFeaturesNeeded(
      result.appearance,
      savedAppearance,
      free,
    ).filter((feature) => !can(feature));
  }, [appearance, savedAppearance, can, free]);
};
