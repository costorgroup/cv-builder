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
  const renderRow = (title: string, show: boolean, children: ReactNode) =>
    show && (
      <>
        <SMinimalTemplateLabel cvColors={colors}>{title}</SMinimalTemplateLabel>
        <SMinimalTemplateContent cvColors={colors}>
          {children}
        </SMinimalTemplateContent>
      </>
    );

  const renderList = (title: string, entries: TTemplateEntry[]) =>
    renderRow(
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
      <SMinimalTemplateName cvColors={colors}>
        {firstName} <strong>{lastName}</strong>
      </SMinimalTemplateName>
      <SMinimalTemplateRows
        labelsEnd={getSectionSize(sizes, "columns", "labels", 30)}
      >
        {renderRow(
          "About",
          Boolean(aboutMe),
          <SMinimalTemplateParagraph>{aboutMe}</SMinimalTemplateParagraph>,
        )}
        {renderRow(
          "Experience",
          experience.length > 0,
          <TemplateEntries items={experience} />,
        )}
        {renderRow(
          "Education",
          education.length > 0,
          <TemplateEntries items={education} />,
        )}
        {renderRow(
          "Projects",
          projects.length > 0,
          <TemplateEntries items={projects} />,
        )}
        {renderRow(
          "Certificates",
          certificates.length > 0,
          <TemplateEntries items={certificates} />,
        )}
        {renderRow(
          "Skills",
          skills.length > 0,
          <TemplateInlineList items={skills} separator=" / " />,
        )}
        {renderRow(
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
          "Interests",
          interests.length > 0,
          <TemplateInlineList items={interests} separator=" / " />,
        )}
        {renderList("Contact", contact)}
        {renderList("Social", socials)}
      </SMinimalTemplateRows>
    </SMinimalTemplate>
  );
};

export const minimalTemplate: TTemplate<TMinimalTemplateColorKey> = {
  ...minimalTemplateSpec,
  render: (props) => <MinimalTemplateCv {...props} />,
};

export default minimalTemplate;
