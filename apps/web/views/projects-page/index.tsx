"use client";

import { GridCell } from "@costor/ui";
import {
  CvDateField,
  CvTextArea,
  CvTextField,
} from "@/components/cv-form-fields";
import CvListEditor from "@/components/cv-list-editor";
import type { TProjectsPageProps } from "@/views/projects-page/types";

const ProjectsPage = ({ ...props }: TProjectsPageProps) => (
  <CvListEditor
    listKey="projects"
    getSummary={({ name }) => name}
    newItemLabel="New project"
    addLabel="Add project"
    emptyText="No projects added yet."
    renderFields={(item, name) => (
      <>
        <GridCell colSpan={2}>
          <CvTextField
            name={name("name")}
            label="Project Name"
            variant="subtle"
            size="sm"
            required
          />
        </GridCell>
        <GridCell>
          <CvTextField
            name={name("role")}
            label="Role"
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
        <GridCell>
          <CvDateField
            name={name("startDate")}
            label="Start Date"
            variant="subtle"
            size="sm"
          />
        </GridCell>
        <GridCell>
          <CvDateField
            name={name("endDate")}
            label="End Date"
            variant="subtle"
            size="sm"
            minDate={item.startDate}
          />
        </GridCell>
        <GridCell colSpan={2}>
          <CvTextArea
            name={name("description")}
            label="Description"
            variant="subtle"
            size="sm"
            rows={3}
            autoGrow
          />
        </GridCell>
      </>
    )}
    {...props}
  />
);

export default ProjectsPage;
