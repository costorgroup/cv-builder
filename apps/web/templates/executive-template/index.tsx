"use client";

import { Fragment, type ReactNode } from "react";
import {
  SExecutiveTemplate,
  SExecutiveTemplateAside,
  SExecutiveTemplateColumns,
  SExecutiveTemplateHeader,
  SExecutiveTemplateHeading,
  SExecutiveTemplateList,
  SExecutiveTemplateMain,
  SExecutiveTemplateName,
  SExecutiveTemplateParagraph,
  SExecutiveTemplatePhoto,
  SExecutiveTemplateSection,
} from "@/templates/executive-template/styles";
import type {
  TExecutiveTemplateColorKey,
  TExecutiveTemplateProps,
} from "@/templates/executive-template/types";
import {
  mutedColor,
  TemplateEntries,
  TemplateInlineList,
  TemplateLevels,
  TemplatePhotoContent,
  useTemplateContent,
  type TTemplateEntry,
} from "@/templates/shared";
import { executiveTemplateSpec } from "@repo/cv-core";
import type { TTemplate } from "@/templates/types";
import { getSectionSize } from "@/templates/utils";

const ExecutiveTemplateCv = ({
  colors,
  sizes,
  typography,
}: TExecutiveTemplateProps) => {
  const {
    fullName,
    initials,
    aboutMe,
    photo,
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

  const renderSection = (title: string, show: boolean, children: ReactNode) =>
    show && (
      <SExecutiveTemplateSection>
        <SExecutiveTemplateHeading cvColors={colors}>
          {title}
        </SExecutiveTemplateHeading>
        {children}
      </SExecutiveTemplateSection>
    );

  const renderList = (title: string, entries: TTemplateEntry[]) =>
    renderSection(
      title,
      entries.length > 0,
      <SExecutiveTemplateList>
        {entries.map(({ label, value }) => (
          <Fragment key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </SExecutiveTemplateList>,
    );

  return (
    <SExecutiveTemplate cvColors={colors} typography={typography}>
      <SExecutiveTemplateHeader
        cvColors={colors}
        basis={getSectionSize(sizes, "rows", "header", 26)}
      >
        <SExecutiveTemplatePhoto cvColors={colors}>
          <TemplatePhotoContent
            photo={photo}
            initials={initials}
            alt={fullName}
          />
        </SExecutiveTemplatePhoto>
        {fullName && (
          <SExecutiveTemplateName>{fullName}</SExecutiveTemplateName>
        )}
      </SExecutiveTemplateHeader>
      <SExecutiveTemplateColumns>
        <SExecutiveTemplateAside
          cvColors={colors}
          basis={getSectionSize(sizes, "columns", "aside", 34)}
        >
          {renderList("Contact", contact)}
          {renderSection(
            "Skills",
            skills.length > 0,
            <TemplateLevels
              items={skills}
              variant="bar"
              color={colors.accent}
              trackColor={mutedColor(colors.text, 15)}
            />,
          )}
          {renderSection(
            "Languages",
            languages.length > 0,
            <TemplateLevels
              items={languages}
              variant="stars"
              color={colors.accent}
              trackColor={mutedColor(colors.text, 20)}
            />,
          )}
          {renderSection(
            "Interests",
            interests.length > 0,
            <TemplateInlineList items={interests} separator=" · " />,
          )}
          {renderList("Social Media", socials)}
        </SExecutiveTemplateAside>
        <SExecutiveTemplateMain
          cvColors={colors}
          basis={getSectionSize(sizes, "columns", "main", 66)}
        >
          {renderSection(
            "Executive Summary",
            Boolean(aboutMe),
            <SExecutiveTemplateParagraph>
              {aboutMe}
            </SExecutiveTemplateParagraph>,
          )}
          {renderSection(
            "Experience",
            experience.length > 0,
            <TemplateEntries items={experience} />,
          )}
          {renderSection(
            "Education",
            education.length > 0,
            <TemplateEntries items={education} />,
          )}
          {renderSection(
            "Projects",
            projects.length > 0,
            <TemplateEntries items={projects} />,
          )}
          {renderSection(
            "Certificates",
            certificates.length > 0,
            <TemplateEntries items={certificates} />,
          )}
        </SExecutiveTemplateMain>
      </SExecutiveTemplateColumns>
    </SExecutiveTemplate>
  );
};

export const executiveTemplate: TTemplate<TExecutiveTemplateColorKey> = {
  ...executiveTemplateSpec,
  render: (props) => <ExecutiveTemplateCv {...props} />,
};

export default executiveTemplate;
