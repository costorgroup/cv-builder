"use client";

import { GridCell } from "@costor/ui";
import {
  CvCheckBox,
  CvDateField,
  CvTextArea,
  CvTextField,
} from "@/components/cv-form-fields";
import CvListEditor from "@/components/cv-list-editor";
import type { TEducationPageProps } from "@/views/education-page/types";

const EducationPage = ({ ...props }: TEducationPageProps) => (
  <CvListEditor
    listKey="education"
    getSummary={({ degree, institution }) =>
      [degree, institution].filter(Boolean).join(", ")
    }
    newItemLabel="New education"
    addLabel="Add education"
    emptyText="No education added yet."
    renderFields={(item, name) => (
      <>
        <GridCell colSpan={2}>
          <CvTextField
            name={name("degree")}
            label="Degree"
            variant="subtle"
            size="sm"
            required
          />
        </GridCell>
        <GridCell>
          <CvTextField
            name={name("institution")}
            label="Institution"
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
            label="I currently study here"
            size="sm"
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

export default EducationPage;
