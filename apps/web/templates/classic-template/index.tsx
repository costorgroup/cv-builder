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
} from "@/templates/shared";
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
  } = useTemplateContent();

  const renderSection = (title: string, show: boolean, children: ReactNode) =>
    show && (
      <SClassicTemplateSection>
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
        {fullName && <SClassicTemplateName>{fullName}</SClassicTemplateName>}
        {contact.length > 0 && (
          <SClassicTemplateContact cvColors={colors}>
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
          "Profile",
          Boolean(aboutMe),
          <SClassicTemplateParagraph>{aboutMe}</SClassicTemplateParagraph>,
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
        {renderSection(
          "Skills",
          skills.length > 0,
          <TemplateInlineList items={skills} separator=" · " />,
        )}
        {renderSection(
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
  id: "classic",
  name: "Classic",
  defaultFontId: "merriweather",
  colorSchemes: [
    {
      id: "ink",
      name: "Ink",
      colors: { background: "#ffffff", text: "#111827", accent: "#1e3a8a" },
    },
    {
      id: "sepia",
      name: "Sepia",
      colors: { background: "#fbf7ef", text: "#3b2f24", accent: "#8b5e34" },
    },
  ],
  groups: [
    {
      id: "rows",
      label: "Rows",
      direction: "vertical",
      sections: [
        {
          id: "header",
          label: "Header",
          size: { value: 24, min: 16, max: 34 },
        },
        { id: "body", label: "Body", size: { value: 76 } },
      ],
    },
  ],
  render: (props) => <ClassicTemplateCv {...props} />,
};

export default classicTemplate;
