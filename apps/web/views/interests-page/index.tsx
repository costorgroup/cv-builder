"use client";

import { GridCell } from "@costor/ui";
import { CvTextField } from "@/components/cv-form-fields";
import CvListEditor from "@/components/cv-list-editor";
import type { TInterestsPageProps } from "@/views/interests-page/types";

const InterestsPage = ({ ...props }: TInterestsPageProps) => (
  <CvListEditor
    listKey="interests"
    getSummary={({ name }) => name}
    newItemLabel="New interest"
    addLabel="Add interest"
    emptyTitle="No interests added yet"
    emptyDescription="Add hobbies and interests that show who you are outside work."
    renderFields={(_, name) => (
      <GridCell colSpan={2}>
        <CvTextField
          name={name("name")}
          label="Interest"
          variant="subtle"
          size="sm"
          required
        />
      </GridCell>
    )}
    {...props}
  />
);

export default InterestsPage;
