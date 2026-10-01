"use client";

import { Fragment, type ReactNode } from "react";
import {
  STechTemplate,
  STechTemplateHeading,
  STechTemplateList,
  STechTemplateMain,
  STechTemplateName,
  STechTemplateParagraph,
  STechTemplatePhoto,
  STechTemplateSection,
  STechTemplateSidebar,
} from "@/templates/tech-template/styles";
import type {
  TTechTemplateColorKey,
  TTechTemplateProps,
} from "@/templates/tech-template/types";
import {
  mutedColor,
  TemplateChips,
  TemplateEntries,
  TemplateLevels,
  TemplatePhotoContent,
  useTemplateContent,
  type TTemplateEntry,
} from "@/templates/shared";
import { techTemplateSpec } from "@repo/cv-core";
import type { TTemplate } from "@/templates/types";
import { getSectionSize } from "@/templates/utils";

const TechTemplateCv = ({ colors, sizes, typography }: TTechTemplateProps) => {
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
      <STechTemplateSection>
        <STechTemplateHeading cvColors={colors}>{title}</STechTemplateHeading>
        {children}
      </STechTemplateSection>
    );

  const renderList = (title: string, entries: TTemplateEntry[]) =>
    renderSection(
      title,
      entries.length > 0,
      <STechTemplateList cvColors={colors}>
        {entries.map(({ label, value }) => (
          <Fragment key={label}>
            <dt>{label.toLowerCase()}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </STechTemplateList>,
    );

  return (
    <STechTemplate cvColors={colors} typography={typography}>
      <STechTemplateSidebar
        cvColors={colors}
        basis={getSectionSize(sizes, "columns", "sidebar", 32)}
      >
        <STechTemplatePhoto cvColors={colors}>
          <TemplatePhotoContent
            photo={photo}
            initials={initials}
            alt={fullName}
          />
        </STechTemplatePhoto>
        {renderList("contact", contact)}
        {renderSection(
          "stack",
          skills.length > 0,
          <TemplateChips
            items={skills}
            background={mutedColor(colors.accent, 20)}
            color={colors.accent}
          />,
        )}
        {renderSection(
          "languages",
          languages.length > 0,
          <TemplateLevels
            items={languages}
            variant="bar"
            color={colors.accent}
            trackColor={mutedColor(colors.muted, 30)}
          />,
        )}
        {renderSection(
          "interests",
          interests.length > 0,
          <TemplateChips
            items={interests}
            background={mutedColor(colors.accent, 20)}
            color={colors.accent}
          />,
        )}
        {renderList("links", socials)}
      </STechTemplateSidebar>
      <STechTemplateMain
        cvColors={colors}
        basis={getSectionSize(sizes, "columns", "main", 68)}
      >
        {fullName && (
          <STechTemplateName cvColors={colors}>{fullName}</STechTemplateName>
        )}
        {renderSection(
          "about",
          Boolean(aboutMe),
          <STechTemplateParagraph>{aboutMe}</STechTemplateParagraph>,
        )}
        {renderSection(
          "experience",
          experience.length > 0,
          <TemplateEntries items={experience} />,
        )}
        {renderSection(
          "projects",
          projects.length > 0,
          <TemplateEntries items={projects} />,
        )}
        {renderSection(
          "education",
          education.length > 0,
          <TemplateEntries items={education} />,
        )}
        {renderSection(
          "certificates",
          certificates.length > 0,
          <TemplateEntries items={certificates} />,
        )}
      </STechTemplateMain>
    </STechTemplate>
  );
};

export const techTemplate: TTemplate<TTechTemplateColorKey> = {
  ...techTemplateSpec,
  render: (props) => <TechTemplateCv {...props} />,
};

export default techTemplate;
