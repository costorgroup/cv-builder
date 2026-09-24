"use client";

import { useSyncExternalStore } from "react";
import { CvDisplay } from "@/components";
import { CvProvider } from "@/providers/cv-provider";

// Only the CV pages, at A4 size. The API's PDF renderer opens this page in
// headless Chrome, hands it the CV through `window.__CV_DOCUMENT__` and prints
// it.
const printCss = `
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; background: #ffffff; }
  nextjs-portal { display: none !important; }
`;

// Set once before the page loads and never changes, so there's nothing to
// subscribe to; on the server there is no CV yet.
const subscribe = () => () => {};
const getCvDocument = () => window.__CV_DOCUMENT__;
const getServerCvDocument = () => undefined;

const PrintPage = () => {
  const cvDocument = useSyncExternalStore(
    subscribe,
    getCvDocument,
    getServerCvDocument,
  );

  return (
    <>
      <style>{printCss}</style>
      {cvDocument && (
        <CvProvider
          initialData={cvDocument.data}
          initialAppearance={cvDocument.appearance}
        >
          <CvDisplay
            variant="print"
            onReady={() => {
              window.__CV_READY__ = true;
            }}
          />
        </CvProvider>
      )}
    </>
  );
};

export default PrintPage;
