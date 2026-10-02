"use client";

import { Fragment, type ReactNode } from "react";
import {
  SClassicTemplate,
  SClassicTemplateBody,
  SClassicTemplateContact,
  SClassicTemplateHeader,
  SClassicTemplateHeading,
  SClassicTemplateList,
  SClassicTemplateName,
  SClassicTemplateParagraph,
  SClassicTemplateSection,
} from "@/templates/classic-template/styles";
import type {
  TClassicTemplateColorKey,
  TClassicTemplateProps,
} from "@/templates/classic-template/types";
import {
  TemplateEntries,
  TemplateInlineList,
  TemplateLevels,
  useTemplateContent,
  cvStep,
  type TTemplateStep,
} from "@/templates/shared";
import { classicTemplateSpec } from "@repo/cv-core";
import type { TTemplate } from "@/templates/types";
import { getSectionSize } from "@/templates/utils";

const ClassicTemplateCv = ({
  colors,
  sizes,
  typography,
}: TClassicTemplateProps) => {
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

  const renderSection = (
    step: TTemplateStep,
    title: string,
    show: boolean,
    children: ReactNode,
  ) =>
    show && (
      <SClassicTemplateSection {...cvStep(step)}>
        <SClassicTemplateHeading cvColors={colors}>
          {title}
        </SClassicTemplateHeading>
        {children}
      </SClassicTemplateSection>
    );

  return (
    <SClassicTemplate cvColors={colors} typography={typography}>
      <SClassicTemplateHeader
        cvColors={colors}
        basis={getSectionSize(sizes, "rows", "header", 24)}
      >
        {fullName && (
          <SClassicTemplateName {...cvStep("personal-information")}>
            {fullName}
          </SClassicTemplateName>
        )}
        {contact.length > 0 && (
          <SClassicTemplateContact
            {...cvStep("personal-information")}
            cvColors={colors}
          >
            {contact.map(({ label, value }) => (
              <span key={label}>{value}</span>
            ))}
          </SClassicTemplateContact>
        )}
      </SClassicTemplateHeader>
      <SClassicTemplateBody
        cvColors={colors}
        basis={getSectionSize(sizes, "rows", "body", 76)}
      >
        {renderSection(
          "personal-information",
          "Profile",
          Boolean(aboutMe),
          <SClassicTemplateParagraph>{aboutMe}</SClassicTemplateParagraph>,
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
        {renderSection(
          "skills",
          "Skills",
          skills.length > 0,
          <TemplateInlineList items={skills} separator=" · " />,
        )}
        {renderSection(
          "languages",
          "Languages",
          languages.length > 0,
          <TemplateLevels
            items={languages}
            variant="text"
            color={colors.accent}
            trackColor={colors.accent}
          />,
        )}
        {renderSection(
          "interests",
          "Interests",
          interests.length > 0,
          <TemplateInlineList items={interests} separator=" · " />,
        )}
        {renderSection(
          "social-media",
          "Social Media",
          socials.length > 0,
          <SClassicTemplateList>
            {socials.map(({ label, value }) => (
              <Fragment key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </Fragment>
            ))}
          </SClassicTemplateList>,
        )}
      </SClassicTemplateBody>
    </SClassicTemplate>
  );
};

export const classicTemplate: TTemplate<TClassicTemplateColorKey> = {
  ...classicTemplateSpec,
  render: (props) => <ClassicTemplateCv {...props} />,
};

export default classicTemplate;
