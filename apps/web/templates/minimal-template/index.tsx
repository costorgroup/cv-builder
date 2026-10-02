"use client";

import { Fragment, type ReactNode } from "react";
import {
  SMinimalTemplate,
  SMinimalTemplateContent,
  SMinimalTemplateLabel,
  SMinimalTemplateList,
  SMinimalTemplateName,
  SMinimalTemplateParagraph,
  SMinimalTemplateRows,
} from "@/templates/minimal-template/styles";
import type {
  TMinimalTemplateColorKey,
  TMinimalTemplateProps,
} from "@/templates/minimal-template/types";
import {
  mutedColor,
  TemplateEntries,
  TemplateInlineList,
  TemplateLevels,
  useTemplateContent,
  type TTemplateEntry,
  cvStep,
  type TTemplateStep,
} from "@/templates/shared";
import { minimalTemplateSpec } from "@repo/cv-core";
import type { TTemplate } from "@/templates/types";
import { getSectionSize } from "@/templates/utils";

const MinimalTemplateCv = ({
  colors,
  sizes,
  typography,
}: TMinimalTemplateProps) => {
  const {
    firstName,
    lastName,
    aboutMe,
    contact,
    socials,
    experience,
    education,
    projects,
    certificates,
    skills,
    languages,
    interests,
  } = useTemplateContent();

  // One grid row: the label on the left, the content on the right.
  const renderRow = (
    step: TTemplateStep,
    title: string,
    show: boolean,
    children: ReactNode,
  ) =>
    show && (
      <>
        <SMinimalTemplateLabel {...cvStep(step)} cvColors={colors}>
          {title}
        </SMinimalTemplateLabel>
        <SMinimalTemplateContent {...cvStep(step)} cvColors={colors}>
          {children}
        </SMinimalTemplateContent>
      </>
    );

  const renderList = (
    step: TTemplateStep,
    title: string,
    entries: TTemplateEntry[],
  ) =>
    renderRow(
      step,
      title,
      entries.length > 0,
      <SMinimalTemplateList cvColors={colors}>
        {entries.map(({ label, value }) => (
          <Fragment key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </SMinimalTemplateList>,
    );

  return (
    <SMinimalTemplate cvColors={colors} typography={typography}>
      <SMinimalTemplateName
        {...cvStep("personal-information")}
        cvColors={colors}
      >
        {firstName} <strong>{lastName}</strong>
      </SMinimalTemplateName>
      <SMinimalTemplateRows
        labelsEnd={getSectionSize(sizes, "columns", "labels", 30)}
      >
        {renderRow(
          "personal-information",
          "About",
          Boolean(aboutMe),
          <SMinimalTemplateParagraph>{aboutMe}</SMinimalTemplateParagraph>,
        )}
        {renderRow(
          "work-experience",
          "Experience",
          experience.length > 0,
          <TemplateEntries items={experience} />,
        )}
        {renderRow(
          "education",
          "Education",
          education.length > 0,
          <TemplateEntries items={education} />,
        )}
        {renderRow(
          "projects",
          "Projects",
          projects.length > 0,
          <TemplateEntries items={projects} />,
        )}
        {renderRow(
          "certificates",
          "Certificates",
          certificates.length > 0,
          <TemplateEntries items={certificates} />,
        )}
        {renderRow(
          "skills",
          "Skills",
          skills.length > 0,
          <TemplateInlineList items={skills} separator=" / " />,
        )}
        {renderRow(
          "languages",
          "Languages",
          languages.length > 0,
          <TemplateLevels
            items={languages}
            variant="dots"
            color={colors.accent}
            trackColor={mutedColor(colors.muted, 35)}
          />,
        )}
        {renderRow(
          "interests",
          "Interests",
          interests.length > 0,
          <TemplateInlineList items={interests} separator=" / " />,
        )}
        {renderList("personal-information", "Contact", contact)}
        {renderList("social-media", "Social", socials)}
      </SMinimalTemplateRows>
    </SMinimalTemplate>
  );
};

export const minimalTemplate: TTemplate<TMinimalTemplateColorKey> = {
  ...minimalTemplateSpec,
  render: (props) => <MinimalTemplateCv {...props} />,
};

export default minimalTemplate;
