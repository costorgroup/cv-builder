"use client";

import { Heading, Small, Text } from "@costor/ui";
import {
  SLegalDocument,
  SLegalDocumentBody,
  SLegalDocumentContent,
  SLegalDocumentHeader,
  SLegalDocumentSection,
  SLegalDocumentTitle,
  SLegalDocumentToc,
  SLegalDocumentTocLink,
} from "@/components/legal-document/styles";
import type { TLegalDocumentProps } from "@/components/legal-document/types";
import { LEGAL_LAST_UPDATED } from "@/utils/site";

/** A legal page: title, table of contents and numbered sections. */
export const LegalDocument = ({
  title,
  summary,
  sections,
}: TLegalDocumentProps) => (
  <SLegalDocument>
    <SLegalDocumentHeader radius="lg">
      <SLegalDocumentTitle as="h1">{title}</SLegalDocumentTitle>
      <Text color="secondary">{summary}</Text>
      <Small color="secondary">Last updated: {LEGAL_LAST_UPDATED}</Small>
    </SLegalDocumentHeader>
    <SLegalDocumentBody>
      <SLegalDocumentToc
        radius="lg"
        role="navigation"
        aria-label="On this page"
      >
        {sections.map(({ id, title: sectionTitle }, index) => (
          <SLegalDocumentTocLink key={id} href={`#${id}`}>
            {index + 1}. {sectionTitle}
          </SLegalDocumentTocLink>
        ))}
      </SLegalDocumentToc>
      <SLegalDocumentContent radius="lg">
        {sections.map(({ id, title: sectionTitle, content }, index) => (
          <SLegalDocumentSection
            key={id}
            id={id}
            aria-labelledby={`${id}-title`}
          >
            <Heading as="h4" id={`${id}-title`}>
              {index + 1}. {sectionTitle}
            </Heading>
            {content}
          </SLegalDocumentSection>
        ))}
      </SLegalDocumentContent>
    </SLegalDocumentBody>
  </SLegalDocument>
);

export type { TLegalSection } from "@/components/legal-document/types";
export default LegalDocument;
