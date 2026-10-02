"use client";

import { Fragment, type ReactNode } from "react";
import {
  SDefaultTemplate,
  SDefaultTemplateHeading,
  SDefaultTemplateList,
  SDefaultTemplateMain,
  SDefaultTemplateName,
  SDefaultTemplateParagraph,
  SDefaultTemplatePhoto,
  SDefaultTemplateSection,
  SDefaultTemplateSidebar,
} from "@/templates/default-template/styles";
import type {
  TDefaultTemplateColorKey,
  TDefaultTemplateProps,
} from "@/templates/default-template/types";
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
import { defaultTemplateSpec } from "@repo/cv-core";
import type { TTemplate } from "@/templates/types";
import { getSectionSize } from "@/templates/utils";

const DefaultTemplateCv = ({
  colors,
  sizes,
  typography,
}: TDefaultTemplateProps) => {
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
      <SDefaultTemplateSection {...cvStep(step)}>
        <SDefaultTemplateHeading cvColors={colors}>
          {title}
        </SDefaultTemplateHeading>
        {children}
      </SDefaultTemplateSection>
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
      <SDefaultTemplateList>
        {entries.map(({ label, value }) => (
          <Fragment key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </SDefaultTemplateList>,
    );

  return (
    <SDefaultTemplate cvColors={colors} typography={typography}>
      <SDefaultTemplateSidebar
        cvColors={colors}
        basis={getSectionSize(sizes, "columns", "left", 40)}
      >
        <SDefaultTemplatePhoto
          {...cvStep("personal-information")}
          cvColors={colors}
        >
          <TemplatePhotoContent
            photo={photo}
            initials={initials}
            alt={fullName}
          />
        </SDefaultTemplatePhoto>
        {fullName && (
          <SDefaultTemplateName {...cvStep("personal-information")}>
            {fullName}
          </SDefaultTemplateName>
        )}
        {renderList("personal-information", "Contact", contact)}
        {renderList("social-media", "Social Media", socials)}
        {renderSection(
          "skills",
          "Skills",
          skills.length > 0,
          <TemplateLevels
            items={skills}
            variant="bar"
            color={colors.accent}
            trackColor={mutedColor(colors.sidebarText, 25)}
          />,
        )}
        {renderSection(
          "languages",
          "Languages",
          languages.length > 0,
          <TemplateLevels
            items={languages}
            variant="text"
            color={colors.accent}
            trackColor={mutedColor(colors.sidebarText, 25)}
          />,
        )}
        {renderSection(
          "interests",
          "Interests",
          interests.length > 0,
          <TemplateInlineList items={interests} separator=", " />,
        )}
      </SDefaultTemplateSidebar>
      <SDefaultTemplateMain
        cvColors={colors}
        basis={getSectionSize(sizes, "columns", "right", 60)}
      >
        {renderSection(
          "personal-information",
          "About Me",
          Boolean(aboutMe),
          <SDefaultTemplateParagraph>{aboutMe}</SDefaultTemplateParagraph>,
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
      </SDefaultTemplateMain>
    </SDefaultTemplate>
  );
};

export const defaultTemplate: TTemplate<TDefaultTemplateColorKey> = {
  ...defaultTemplateSpec,
  render: (props) => <DefaultTemplateCv {...props} />,
};

export default defaultTemplate;
