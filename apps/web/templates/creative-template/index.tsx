"use client";

import type { ReactNode } from "react";
import {
  SCreativeTemplate,
  SCreativeTemplateChips,
  SCreativeTemplateHeading,
  SCreativeTemplateMain,
  SCreativeTemplateName,
  SCreativeTemplatePhoto,
  SCreativeTemplateQuote,
  SCreativeTemplateSection,
  SCreativeTemplateStrip,
  SCreativeTemplateStripHeading,
  SCreativeTemplateStripList,
} from "@/templates/creative-template/styles";
import type {
  TCreativeTemplateColorKey,
  TCreativeTemplateProps,
} from "@/templates/creative-template/types";
import {
  mutedColor,
  TemplateChips,
  TemplateEntries,
  TemplateInlineList,
  TemplateLevels,
  TemplatePhotoContent,
  useTemplateContent,
} from "@/templates/shared";
import { creativeTemplateSpec } from "@repo/cv-core";
import type { TTemplate } from "@/templates/types";
import { getSectionSize } from "@/templates/utils";

const CreativeTemplateCv = ({
  colors,
  sizes,
  typography,
}: TCreativeTemplateProps) => {
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

  const renderSection = (title: string, show: boolean, children: ReactNode) =>
    show && (
      <SCreativeTemplateSection>
        <SCreativeTemplateHeading cvColors={colors}>
          {title}
        </SCreativeTemplateHeading>
        {children}
      </SCreativeTemplateSection>
    );

  const renderStripSection = (
    title: string,
    show: boolean,
    children: ReactNode,
  ) =>
    show && (
      <SCreativeTemplateSection>
        <SCreativeTemplateStripHeading cvColors={colors}>
          {title}
        </SCreativeTemplateStripHeading>
        {children}
      </SCreativeTemplateSection>
    );

  return (
    <SCreativeTemplate cvColors={colors} typography={typography}>
      <SCreativeTemplateStrip
        cvColors={colors}
        basis={getSectionSize(sizes, "columns", "strip", 36)}
      >
        <SCreativeTemplatePhoto cvColors={colors}>
          <TemplatePhotoContent
            photo={photo}
            initials={initials}
            alt={fullName}
          />
        </SCreativeTemplatePhoto>
        <SCreativeTemplateName cvColors={colors}>
          {firstName}
          <span>{lastName}</span>
        </SCreativeTemplateName>
        {renderStripSection(
          "Get in touch",
          contact.length > 0,
          <SCreativeTemplateStripList>
            {contact.map(({ label, value }) => (
              <li key={label}>{value}</li>
            ))}
          </SCreativeTemplateStripList>,
        )}
        {renderStripSection(
          "Languages",
          languages.length > 0,
          <TemplateLevels
            items={languages}
            variant="dots"
            color={colors.accent}
            trackColor={mutedColor(colors.stripText, 30)}
          />,
        )}
        {renderStripSection(
          "Interests",
          interests.length > 0,
          <TemplateInlineList items={interests} separator=", " />,
        )}
      </SCreativeTemplateStrip>
      <SCreativeTemplateMain
        cvColors={colors}
        basis={getSectionSize(sizes, "columns", "main", 64)}
      >
        {aboutMe && (
          <SCreativeTemplateQuote cvColors={colors}>
            {aboutMe}
          </SCreativeTemplateQuote>
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
          <TemplateChips
            items={skills}
            background={colors.strip}
            color={colors.text}
            outline
          />,
        )}
        {renderSection(
          "Certificates",
          certificates.length > 0,
          <TemplateEntries items={certificates} />,
        )}
        {renderSection(
          "Find me online",
          socials.length > 0,
          <SCreativeTemplateChips cvColors={colors}>
            {socials.map(({ label, value }) => (
              <li key={label}>
                <strong>{label}</strong>
                {value}
              </li>
            ))}
          </SCreativeTemplateChips>,
        )}
      </SCreativeTemplateMain>
    </SCreativeTemplate>
  );
};

export const creativeTemplate: TTemplate<TCreativeTemplateColorKey> = {
  ...creativeTemplateSpec,
  render: (props) => <CreativeTemplateCv {...props} />,
};

export default creativeTemplate;
