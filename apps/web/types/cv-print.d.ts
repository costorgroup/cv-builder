import type { TCvDocument } from "@/providers/cv-provider/types";

// Handshake between the API's PDF renderer (Puppeteer) and the /print page.
declare global {
  interface Window {
    /** The CV to render; set by Puppeteer before the page loads. */
    __CV_DOCUMENT__?: TCvDocument;
    /** Set by the /print page once its page breaks have settled. */
    __CV_READY__?: boolean;
  }
}

export {};
