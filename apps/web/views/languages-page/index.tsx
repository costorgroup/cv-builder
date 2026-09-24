"use client";

import { GridCell } from "@costor/ui";
import { CvSelectField, CvTextField } from "@/components/cv-form-fields";
import CvListEditor from "@/components/cv-list-editor";
import { CV_LEVELS, languageLevelLabel } from "@/providers/cv-provider/items";
import type { TLanguagesPageProps } from "@/views/languages-page/types";

const LanguagesPage = ({ ...props }: TLanguagesPageProps) => (
  <CvListEditor
    listKey="languages"
    getSummary={({ name }) => name}
    newItemLabel="New language"
    addLabel="Add language"
    emptyText="No languages added yet."
    renderFields={(_, name) => (
      <>
        <GridCell colSpan={2}>
          <CvTextField
            name={name("name")}
            label="Language"
            variant="subtle"
            size="sm"
            required
          />
        </GridCell>
        <GridCell colSpan={2}>
          <CvSelectField
            name={name("level")}
            label="Level"
            variant="subtle"
            size="sm"
            options={CV_LEVELS}
            getOptionLabel={languageLevelLabel}
          />
        </GridCell>
      </>
    )}
    {...props}
  />
);

export default LanguagesPage;
