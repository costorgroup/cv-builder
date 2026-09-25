"use client";

import { createContext, useContext, useMemo } from "react";
import { withCvPlaceholders } from "@/providers/cv-provider/placeholders";
import type { TCvContextValue, TCvData } from "@/providers/cv-provider/types";

export const CvContext = createContext<TCvContextValue | null>(null);

/**
 * Whether CVs rendered below fill empty fields with sample data. Off by
 * default; turned on with `<CvPlaceholders>` where templates are being picked,
 * so the preview there shows a complete CV.
 */
export const CvPlaceholdersContext = createContext(false);

export const useCv = (): TCvContextValue => {
  const context = useContext(CvContext);
  if (!context) throw new Error("useCv must be used within a CvProvider");
  return context;
};

/**
 * All CV data for rendering: what was filled in through the CV editor forms,
 * plus sample data for empty fields inside `<CvPlaceholders>`. Forms should
 * read the raw values from `useCv().data` instead.
 */
export const useCvData = (): TCvData => {
  const { data } = useCv();
  const showPlaceholders = useContext(CvPlaceholdersContext);
  return useMemo(
    () => (showPlaceholders ? withCvPlaceholders(data) : data),
    [data, showPlaceholders],
  );
};
