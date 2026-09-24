"use client";

import { GridCell } from "@costor/ui";
import { CvSelectField, CvTextField } from "@/components/cv-form-fields";
import CvListEditor from "@/components/cv-list-editor";
import { CV_LEVELS, skillLevelLabel } from "@/providers/cv-provider/items";
import type { TSkillsPageProps } from "@/views/skills-page/types";

const SkillsPage = ({ ...props }: TSkillsPageProps) => (
  <CvListEditor
    listKey="skills"
    getSummary={({ name }) => name}
    newItemLabel="New skill"
    addLabel="Add skill"
    emptyText="No skills added yet."
    renderFields={(_, name) => (
      <>
        <GridCell colSpan={2}>
          <CvTextField
            name={name("name")}
            label="Skill"
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
            getOptionLabel={skillLevelLabel}
          />
        </GridCell>
      </>
    )}
    {...props}
  />
);

export default SkillsPage;
