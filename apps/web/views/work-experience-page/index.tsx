"use client";

import { GridCell } from "@costor/ui";
import {
  CvCheckBox,
  CvDateField,
  CvTextArea,
  CvTextField,
} from "@/components/cv-form-fields";
import CvListEditor from "@/components/cv-list-editor";
import type { TWorkExperiencePageProps } from "@/views/work-experience-page/types";

const WorkExperiencePage = ({ ...props }: TWorkExperiencePageProps) => (
  <CvListEditor
    listKey="workExperience"
    getSummary={({ position, company }) =>
      [position, company].filter(Boolean).join(" at ")
    }
    newItemLabel="New experience"
    addLabel="Add experience"
    emptyText="No experience added yet."
    renderFields={(item, name) => (
      <>
        <GridCell colSpan={2}>
          <CvTextField
            name={name("position")}
            label="Position"
            variant="subtle"
            size="sm"
            required
          />
        </GridCell>
        <GridCell>
          <CvTextField
            name={name("company")}
            label="Company"
            variant="subtle"
            size="sm"
            required
          />
        </GridCell>
        <GridCell>
          <CvTextField
            name={name("location")}
            label="Location"
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
            disabled={item.current}
            minDate={item.startDate}
          />
        </GridCell>
        <GridCell colSpan={2}>
          <CvCheckBox
            name={name("current")}
            label="I currently work here"
            size="sm"
          />
        </GridCell>
        <GridCell colSpan={2}>
          <CvTextArea
            name={name("description")}
            label="Description"
            variant="subtle"
            size="sm"
            rows={4}
            autoGrow
          />
        </GridCell>
      </>
    )}
    {...props}
  />
);

export default WorkExperiencePage;
