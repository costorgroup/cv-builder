import type { TCvDocument } from "@/providers/cv-provider/types";

/** Where the Nest API that renders PDFs is served. */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** Characters that aren't allowed in file names on common systems. */
const UNSAFE_FILE_NAME = /[\\/:*?"<>|]+/g;

/**
 * Asks the API to render the CV as a PDF and downloads it as
 * `<fileName>.pdf`. Rejects if the PDF couldn't be made.
 */
export const downloadCvPdf = async (
  cvDocument: TCvDocument,
  fileName: string,
) => {
  const response = await fetch(`${API_URL}/cv/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cvDocument),
  });
  if (!response.ok) throw new Error(`PDF request failed (${response.status})`);

  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName.replace(UNSAFE_FILE_NAME, "").trim() || "CV"}.pdf`;
  link.click();
  // Give the browser a moment to start the download before freeing the blob.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};
