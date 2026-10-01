import type { TCvDocument } from "@/providers/cv-provider/types";
import { apiRequest } from "@/utils/api-client";

/** Characters that aren't allowed in file names on common systems. */
const UNSAFE_FILE_NAME = /[\\/:*?"<>|]+/g;

/** What a PDF is made from: a saved CV, or the editor's current state. */
export type TCvPdfSource = { id: string } | (TCvDocument & { cvId?: string });

/** Saves a downloaded file as `<fileName>.pdf`. */
export const saveCvPdf = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName.replace(UNSAFE_FILE_NAME, "").trim() || "CV"}.pdf`;
  link.click();
  // Give the browser a moment to start the download before freeing the blob.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

/**
 * Downloads a PDF of the CV as `<fileName>.pdf`: a saved CV by its id, or the
 * editor's document (`cvId` set when it's a saved CV with unsaved changes).
 * Rejects if the PDF couldn't be made.
 */
export const downloadCvPdf = async (cv: TCvPdfSource, fileName: string) => {
  const blob = await apiRequest<Blob>(
    "id" in cv ? `cvs/${cv.id}/pdf` : "cv/pdf",
    {
      body: "id" in cv ? undefined : cv,
      authenticated: true,
      responseType: "blob",
    },
  );
  saveCvPdf(blob, fileName);
};
