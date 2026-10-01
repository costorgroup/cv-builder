"use client";

import { useEffect, useState } from "react";
import type { TPublicTemplate } from "@repo/cv-core";
import {
  fallbackTemplates,
  offeredTemplates,
  type TOfferedTemplate,
} from "@/utils/offered-templates";
import { useCvEditorEnv } from "@/providers/cv-editor-env";
import { templatesApi } from "@/utils/templates-api";

/** How long a loaded list is reused before it's fetched again. */
const REUSE_MS = 60_000;

let request: { at: number; list: Promise<TPublicTemplate[]> } | undefined;

/** One request for every component asking at about the same time. */
const loadPublished = () => {
  if (!request || Date.now() - request.at > REUSE_MS) {
    const list = templatesApi.list();
    request = { at: Date.now(), list };
    // A failed request isn't reused.
    list.catch(() => (request = undefined));
  }
  return request.list;
};

export type TTemplateCatalogState =
  | { status: "loading" }
  | {
      /** "error": the API couldn't be reached; every template is shown. */
      status: "ready" | "error";
      templates: TOfferedTemplate[];
      /** Ids of the templates every plan includes. */
      free: readonly string[];
    };

const stateOf = (
  status: "ready" | "error",
  templates: TOfferedTemplate[],
): TTemplateCatalogState => ({
  status,
  templates,
  free: templates.filter(({ tier }) => tier === "FREE").map(({ id }) => id),
});

/**
 * The templates on offer (published ones, in order) and which are free, from
 * the API, or the embedded builder's own. Only for listing them and
 * showing locks: the API checks the template when a CV is saved.
 */
export const useTemplateCatalog = (): TTemplateCatalogState => {
  const { templateCatalog } = useCvEditorEnv();
  const [state, setState] = useState<TTemplateCatalogState>({
    status: "loading",
  });

  useEffect(() => {
    if (templateCatalog) return;
    let active = true;
    loadPublished().then(
      (published) =>
        active && setState(stateOf("ready", offeredTemplates(published))),
      () => active && setState(stateOf("error", fallbackTemplates())),
    );
    return () => {
      active = false;
    };
  }, [templateCatalog]);

  return templateCatalog ?? state;
};

/** After an admin changes templates, so this tab shows it at once. */
export const forgetTemplateCatalog = () => {
  request = undefined;
};
