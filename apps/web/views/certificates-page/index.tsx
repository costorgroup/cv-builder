"use client";

import { GridCell } from "@costor/ui";
import { CvDateField, CvTextField } from "@/components/cv-form-fields";
import CvListEditor from "@/components/cv-list-editor";
import type { TCertificatesPageProps } from "@/views/certificates-page/types";

const CertificatesPage = ({ ...props }: TCertificatesPageProps) => (
  <CvListEditor
    listKey="certificates"
    getSummary={({ name }) => name}
    newItemLabel="New certificate"
    addLabel="Add certificate"
    emptyText="No certificates added yet."
    renderFields={(_, name) => (
      <>
        <GridCell colSpan={2}>
          <CvTextField
            name={name("name")}
            label="Certificate"
            variant="subtle"
            size="sm"
            required
          />
        </GridCell>
        <GridCell colSpan={2}>
          <CvTextField
            name={name("issuer")}
            label="Issuer"
            variant="subtle"
            size="sm"
          />
        </GridCell>
        <GridCell>
          <CvDateField
            name={name("date")}
            label="Date"
            variant="subtle"
            size="sm"
          />
        </GridCell>
        <GridCell>
          <CvTextField
            name={name("url")}
            label="Link"
            variant="subtle"
            size="sm"
          />
        </GridCell>
      </>
    )}
    {...props}
  />
);

export default CertificatesPage;
