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
  cvStep,
  type TTemplateStep,
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

  const renderSection = (
    step: TTemplateStep,
    title: string,
    show: boolean,
    children: ReactNode,
  ) =>
    show && (
      <SExecutiveTemplateSection {...cvStep(step)}>
        <SExecutiveTemplateHeading cvColors={colors}>
          {title}
        </SExecutiveTemplateHeading>
        {children}
      </SExecutiveTemplateSection>
    );

  const renderList = (
    step: TTemplateStep,
    title: string,
    entries: TTemplateEntry[],
  ) =>
    renderSection(
      step,
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
        <SExecutiveTemplatePhoto
          {...cvStep("personal-information")}
          cvColors={colors}
        >
          <TemplatePhotoContent
            photo={photo}
            initials={initials}
            alt={fullName}
          />
        </SExecutiveTemplatePhoto>
        {fullName && (
          <SExecutiveTemplateName {...cvStep("personal-information")}>
            {fullName}
          </SExecutiveTemplateName>
        )}
      </SExecutiveTemplateHeader>
      <SExecutiveTemplateColumns>
        <SExecutiveTemplateAside
          cvColors={colors}
          basis={getSectionSize(sizes, "columns", "aside", 34)}
        >
          {renderList("personal-information", "Contact", contact)}
          {renderSection(
            "skills",
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
            "languages",
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
            "interests",
            "Interests",
            interests.length > 0,
            <TemplateInlineList items={interests} separator=" · " />,
          )}
          {renderList("social-media", "Social Media", socials)}
        </SExecutiveTemplateAside>
        <SExecutiveTemplateMain
          cvColors={colors}
          basis={getSectionSize(sizes, "columns", "main", 66)}
        >
          {renderSection(
            "personal-information",
            "Executive Summary",
            Boolean(aboutMe),
            <SExecutiveTemplateParagraph>
              {aboutMe}
            </SExecutiveTemplateParagraph>,
          )}
          {renderSection(
            "work-experience",
            "Experience",
            experience.length > 0,
            <TemplateEntries items={experience} />,
          )}
          {renderSection(
            "education",
            "Education",
            education.length > 0,
            <TemplateEntries items={education} />,
          )}
          {renderSection(
            "projects",
            "Projects",
            projects.length > 0,
            <TemplateEntries items={projects} />,
          )}
          {renderSection(
            "certificates",
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
