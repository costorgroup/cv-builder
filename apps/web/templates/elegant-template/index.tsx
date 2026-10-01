"use client";

import type { ReactNode } from "react";
import {
  SElegantTemplate,
  SElegantTemplateBody,
  SElegantTemplateFrame,
  SElegantTemplateGrid,
  SElegantTemplateHeader,
  SElegantTemplateHeading,
  SElegantTemplateList,
  SElegantTemplateName,
  SElegantTemplateOrnament,
  SElegantTemplateParagraph,
  SElegantTemplateSection,
} from "@/templates/elegant-template/styles";
import type {
  TElegantTemplateColorKey,
  TElegantTemplateProps,
} from "@/templates/elegant-template/types";
import {
  mutedColor,
  TemplateEntries,
  TemplateInlineList,
  TemplateLevels,
  useTemplateContent,
  type TTemplateEntry,
} from "@/templates/shared";
import { elegantTemplateSpec } from "@repo/cv-core";
import type { TTemplate } from "@/templates/types";
import { getSectionSize } from "@/templates/utils";

const ElegantTemplateCv = ({
  colors,
  sizes,
  typography,
}: TElegantTemplateProps) => {
  const {
    fullName,
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

  const renderSection = (title: string, show: boolean, children: ReactNode) =>
    show && (
      <SElegantTemplateSection>
        <SElegantTemplateHeading cvColors={colors}>
          {title}
        </SElegantTemplateHeading>
        {children}
      </SElegantTemplateSection>
    );

  const renderList = (title: string, entries: TTemplateEntry[]) =>
    renderSection(
      title,
      entries.length > 0,
      <SElegantTemplateList>
        {entries.map(({ label, value }) => (
          <li key={label}>{value}</li>
        ))}
      </SElegantTemplateList>,
    );

  return (
    <SElegantTemplate cvColors={colors} typography={typography}>
      <SElegantTemplateHeader
        cvColors={colors}
        basis={getSectionSize(sizes, "rows", "header", 30)}
      >
        <SElegantTemplateFrame cvColors={colors}>
          {fullName && <SElegantTemplateName>{fullName}</SElegantTemplateName>}
          <SElegantTemplateOrnament cvColors={colors}>
            &#10022;
          </SElegantTemplateOrnament>
        </SElegantTemplateFrame>
      </SElegantTemplateHeader>
      <SElegantTemplateBody
        cvColors={colors}
        basis={getSectionSize(sizes, "rows", "body", 70)}
      >
        {aboutMe && (
          <SElegantTemplateParagraph>{aboutMe}</SElegantTemplateParagraph>
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
          "Skills",
          skills.length > 0,
          <TemplateInlineList items={skills} separator="  ✦  " />,
        )}
        <SElegantTemplateGrid>
          {renderSection(
            "Languages",
            languages.length > 0,
            <TemplateLevels
              items={languages}
              variant="stars"
              color={colors.accent}
              trackColor={mutedColor(colors.frame, 45)}
            />,
          )}
          {renderSection(
            "Interests",
            interests.length > 0,
            <TemplateInlineList items={interests} separator="  ✦  " />,
          )}
          {renderSection(
            "Certificates",
            certificates.length > 0,
            <TemplateEntries items={certificates} />,
          )}
          {renderList("Contact", contact)}
          {renderList("Online", socials)}
        </SElegantTemplateGrid>
      </SElegantTemplateBody>
    </SElegantTemplate>
  );
};

export const elegantTemplate: TTemplate<TElegantTemplateColorKey> = {
  ...elegantTemplateSpec,
  render: (props) => <ElegantTemplateCv {...props} />,
};

export default elegantTemplate;
