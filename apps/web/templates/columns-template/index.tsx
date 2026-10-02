"use client";

import { Fragment, type ReactNode } from "react";
import {
  SColumnsTemplate,
  SColumnsTemplateColumn,
  SColumnsTemplateColumns,
  SColumnsTemplateHeader,
  SColumnsTemplateHeading,
  SColumnsTemplateList,
  SColumnsTemplateName,
  SColumnsTemplateParagraph,
  SColumnsTemplatePhoto,
  SColumnsTemplateSection,
} from "@/templates/columns-template/styles";
import type {
  TColumnsTemplateColorKey,
  TColumnsTemplateProps,
} from "@/templates/columns-template/types";
import {
  mutedColor,
  TemplateChips,
  TemplateEntries,
  TemplateLevels,
  TemplatePhotoContent,
  useTemplateContent,
  type TTemplateEntry,
  cvStep,
  type TTemplateStep,
} from "@/templates/shared";
import { columnsTemplateSpec } from "@repo/cv-core";
import type { TTemplate } from "@/templates/types";
import { getSectionSize } from "@/templates/utils";

const ColumnsTemplateCv = ({
  colors,
  sizes,
  typography,
}: TColumnsTemplateProps) => {
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
      <SColumnsTemplateSection {...cvStep(step)}>
        <SColumnsTemplateHeading cvColors={colors}>
          {title}
        </SColumnsTemplateHeading>
        {children}
      </SColumnsTemplateSection>
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
      <SColumnsTemplateList>
        {entries.map(({ label, value }) => (
          <Fragment key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </SColumnsTemplateList>,
    );

  return (
    <SColumnsTemplate cvColors={colors} typography={typography}>
      <SColumnsTemplateHeader cvColors={colors}>
        <SColumnsTemplatePhoto
          {...cvStep("personal-information")}
          cvColors={colors}
        >
          <TemplatePhotoContent
            photo={photo}
            initials={initials}
            alt={fullName}
          />
        </SColumnsTemplatePhoto>
        {fullName && (
          <SColumnsTemplateName {...cvStep("personal-information")}>
            {fullName}
          </SColumnsTemplateName>
        )}
      </SColumnsTemplateHeader>
      <SColumnsTemplateColumns>
        <SColumnsTemplateColumn
          cvColors={colors}
          basis={getSectionSize(sizes, "columns", "profile", 38)}
        >
          {renderSection(
            "personal-information",
            "Profile",
            Boolean(aboutMe),
            <SColumnsTemplateParagraph>{aboutMe}</SColumnsTemplateParagraph>,
          )}
          {renderSection(
            "work-experience",
            "Experience",
            experience.length > 0,
            <TemplateEntries items={experience} />,
          )}
        </SColumnsTemplateColumn>
        <SColumnsTemplateColumn
          cvColors={colors}
          basis={getSectionSize(sizes, "columns", "contact", 32)}
        >
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
        </SColumnsTemplateColumn>
        <SColumnsTemplateColumn
          cvColors={colors}
          basis={getSectionSize(sizes, "columns", "links", 30)}
        >
          {renderList("personal-information", "Contact", contact)}
          {renderSection(
            "skills",
            "Skills",
            skills.length > 0,
            <TemplateChips
              items={skills}
              background={mutedColor(colors.accent, 25)}
              color={colors.text}
            />,
          )}
          {renderSection(
            "languages",
            "Languages",
            languages.length > 0,
            <TemplateLevels
              items={languages}
              variant="bar"
              color={colors.accent}
              trackColor={mutedColor(colors.accent, 20)}
            />,
          )}
          {renderSection(
            "interests",
            "Interests",
            interests.length > 0,
            <TemplateChips
              items={interests}
              background={mutedColor(colors.accent, 25)}
              color={colors.text}
            />,
          )}
          {renderList("social-media", "Links", socials)}
        </SColumnsTemplateColumn>
      </SColumnsTemplateColumns>
    </SColumnsTemplate>
  );
};

export const columnsTemplate: TTemplate<TColumnsTemplateColorKey> = {
  ...columnsTemplateSpec,
  render: (props) => <ColumnsTemplateCv {...props} />,
};

export default columnsTemplate;
