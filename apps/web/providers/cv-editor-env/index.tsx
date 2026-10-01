"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { TCvEditorStep } from "@repo/cv-core";
import type { TSavedCv } from "@/utils/cvs-api";
import type { TCvPdfSource } from "@/utils/download-cv-pdf";
import type { TTemplateCatalogState } from "@/utils/template-catalog";

/**
 * Where the editor runs, when it isn't the app's own: the embedded builder
 * supplies how it saves and downloads, which steps and templates it shows,
 * and what happens after saving. Anything left out is the app's behavior.
 */
export type TCvEditorEnv = {
  /** The editor's address for a CV (without the step). */
  editorPath?: (cvId?: string) => string;
  /** Steps shown, in order. */
  steps?: readonly TCvEditorStep[];
  /** In place of our logo at the top of the steps. */
  brand?: ReactNode;
  /** Whether the light/dark switch shows. */
  themeToggle?: boolean;
  save?: (
    cvId: string | undefined,
    body: Pick<TSavedCv, "name" | "data" | "appearance">,
  ) => Promise<TSavedCv>;
  /** Fetches the PDF; the editor saves it as a file. */
  fetchPdf?: (source: TCvPdfSource) => Promise<Blob>;
  /** Whether PDFs can be downloaded at all. */
  canDownload?: boolean;
  /** After "Save & Finish"; the app goes back to My CVs. */
  onSaved?: (cv: TSavedCv) => void;
  /** Templates on offer; the API's catalog when left out. */
  templateCatalog?: TTemplateCatalogState;
  /** Whether to point to plans; people in an embed can't upgrade. */
  showUpgrades?: boolean;
};

const CvEditorEnvContext = createContext<TCvEditorEnv>({});

export const CvEditorEnvProvider = ({
  env,
  children,
}: {
  env: TCvEditorEnv;
  children: ReactNode;
}) => (
  <CvEditorEnvContext.Provider value={env}>
    {children}
  </CvEditorEnvContext.Provider>
);

/** The editor's environment; the app's own when there's no provider. */
export const useCvEditorEnv = () => useContext(CvEditorEnvContext);
