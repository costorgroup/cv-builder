import type { ReactNode } from "react";

export type TLegalSection = {
  /** Anchor id, also used in the table of contents. */
  id: string;
  title: string;
  content: ReactNode;
};

export type TLegalDocumentProps = {
  title: string;
  /** A sentence or two under the title. */
  summary: ReactNode;
  sections: TLegalSection[];
};
