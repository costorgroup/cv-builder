"use client";

import { Fragment, type ReactNode } from "react";
import {
  SModernTemplate,
  SModernTemplateHeading,
  SModernTemplateList,
  SModernTemplateMain,
  SModernTemplateName,
  SModernTemplateParagraph,
  SModernTemplatePhoto,
  SModernTemplateSection,
  SModernTemplateSidebar,
} from "@/templates/modern-template/styles";
import type {
  TModernTemplateColorKey,
  TModernTemplateProps,
} from "@/templates/modern-template/types";
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
import { modernTemplateSpec } from "@repo/cv-core";
import type { TTemplate } from "@/templates/types";
import { getSectionSize } from "@/templates/utils";

const ModernTemplateCv = ({
  colors,
  sizes,
  typography,
}: TModernTemplateProps) => {
  const {
    firstName,
    lastName,
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
      <SModernTemplateSection {...cvStep(step)}>
        <SModernTemplateHeading cvColors={colors}>
          {title}
        </SModernTemplateHeading>
        {children}
      </SModernTemplateSection>
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
      <SModernTemplateList>
        {entries.map(({ label, value }) => (
          <Fragment key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </SModernTemplateList>,
    );

  return (
    <SModernTemplate cvColors={colors} typography={typography}>
      <SModernTemplateMain
        cvColors={colors}
        basis={getSectionSize(sizes, "columns", "main", 64)}
      >
        <SModernTemplateName
          {...cvStep("personal-information")}
          cvColors={colors}
        >
          {firstName}
          <span>{lastName}</span>
        </SModernTemplateName>
        {renderSection(
          "personal-information",
          "About Me",
          Boolean(aboutMe),
          <SModernTemplateParagraph>{aboutMe}</SModernTemplateParagraph>,
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
      </SModernTemplateMain>
      <SModernTemplateSidebar
        cvColors={colors}
        basis={getSectionSize(sizes, "columns", "sidebar", 36)}
      >
        <SModernTemplatePhoto
          {...cvStep("personal-information")}
          cvColors={colors}
        >
          <TemplatePhotoContent
            photo={photo}
            initials={initials}
            alt={fullName}
          />
        </SModernTemplatePhoto>
        {renderList("personal-information", "Contact", contact)}
        {renderList("social-media", "Social Media", socials)}
        {renderSection(
          "skills",
          "Skills",
          skills.length > 0,
          <TemplateChips
            items={skills}
            background={colors.accent}
            color={colors.sidebar}
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
            trackColor={mutedColor(colors.sidebarText, 30)}
          />,
        )}
        {renderSection(
          "interests",
          "Interests",
          interests.length > 0,
          <TemplateChips
            items={interests}
            background={colors.accent}
            color={colors.sidebar}
          />,
        )}
        {renderSection(
          "certificates",
          "Certificates",
          certificates.length > 0,
          <TemplateEntries items={certificates} />,
        )}
      </SModernTemplateSidebar>
    </SModernTemplate>
  );
};

export const modernTemplate: TTemplate<TModernTemplateColorKey> = {
  ...modernTemplateSpec,
  render: (props) => <ModernTemplateCv {...props} />,
};

export default modernTemplate;
