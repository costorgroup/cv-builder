"use client";

import { Fragment, type ReactNode } from "react";
import {
  SBoldTemplate,
  SBoldTemplateBody,
  SBoldTemplateHeading,
  SBoldTemplateHero,
  SBoldTemplateList,
  SBoldTemplateName,
  SBoldTemplateParagraph,
  SBoldTemplatePhoto,
  SBoldTemplateSection,
  SBoldTemplateWideSection,
} from "@/templates/bold-template/styles";
import type {
  TBoldTemplateColorKey,
  TBoldTemplateProps,
} from "@/templates/bold-template/types";
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
import { boldTemplateSpec } from "@repo/cv-core";
import type { TTemplate } from "@/templates/types";
import { getSectionSize } from "@/templates/utils";

const BoldTemplateCv = ({ colors, sizes, typography }: TBoldTemplateProps) => {
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

  // Wide sections span both body columns.
  const renderSection = (
    step: TTemplateStep,
    title: string,
    show: boolean,
    children: ReactNode,
    wide = false,
  ) => {
    if (!show) return null;
    const Section = wide ? SBoldTemplateWideSection : SBoldTemplateSection;
    return (
      <Section {...cvStep(step)}>
        <SBoldTemplateHeading cvColors={colors}>{title}</SBoldTemplateHeading>
        {children}
      </Section>
    );
  };

  const renderList = (
    step: TTemplateStep,
    title: string,
    entries: TTemplateEntry[],
  ) =>
    renderSection(
      step,
      title,
      entries.length > 0,
      <SBoldTemplateList>
        {entries.map(({ label, value }) => (
          <Fragment key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </SBoldTemplateList>,
    );

  return (
    <SBoldTemplate cvColors={colors} typography={typography}>
      <SBoldTemplateHero
        cvColors={colors}
        basis={getSectionSize(sizes, "rows", "hero", 36)}
      >
        {fullName && (
          <SBoldTemplateName {...cvStep("personal-information")}>
            {fullName}
          </SBoldTemplateName>
        )}
        <SBoldTemplatePhoto
          {...cvStep("personal-information")}
          cvColors={colors}
        >
          <TemplatePhotoContent
            photo={photo}
            initials={initials}
            alt={fullName}
          />
        </SBoldTemplatePhoto>
      </SBoldTemplateHero>
      <SBoldTemplateBody
        cvColors={colors}
        basis={getSectionSize(sizes, "rows", "body", 64)}
      >
        {renderSection(
          "personal-information",
          "About",
          Boolean(aboutMe),
          <SBoldTemplateParagraph>{aboutMe}</SBoldTemplateParagraph>,
          true,
        )}
        {renderSection(
          "work-experience",
          "Experience",
          experience.length > 0,
          <TemplateEntries items={experience} />,
          true,
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
          "skills",
          "Skills",
          skills.length > 0,
          <TemplateChips
            items={skills}
            background={colors.hero}
            color={colors.heroText}
          />,
        )}
        {renderSection(
          "languages",
          "Languages",
          languages.length > 0,
          <TemplateLevels
            items={languages}
            variant="dots"
            color={colors.text}
            trackColor={mutedColor(colors.text, 18)}
          />,
        )}
        {renderSection(
          "interests",
          "Interests",
          interests.length > 0,
          <TemplateChips
            items={interests}
            background={colors.hero}
            color={colors.heroText}
          />,
        )}
        {renderSection(
          "certificates",
          "Certificates",
          certificates.length > 0,
          <TemplateEntries items={certificates} />,
        )}
        {renderList("personal-information", "Contact", contact)}
        {renderList("social-media", "Social", socials)}
      </SBoldTemplateBody>
    </SBoldTemplate>
  );
};

export const boldTemplate: TTemplate<TBoldTemplateColorKey> = {
  ...boldTemplateSpec,
  render: (props) => <BoldTemplateCv {...props} />,
};

export default boldTemplate;
