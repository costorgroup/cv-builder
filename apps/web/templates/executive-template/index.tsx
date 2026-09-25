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
} from "@/templates/shared";
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

  const renderSection = (title: string, show: boolean, children: ReactNode) =>
    show && (
      <SExecutiveTemplateSection>
        <SExecutiveTemplateHeading cvColors={colors}>
          {title}
        </SExecutiveTemplateHeading>
        {children}
      </SExecutiveTemplateSection>
    );

  const renderList = (title: string, entries: TTemplateEntry[]) =>
    renderSection(
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
        <SExecutiveTemplatePhoto cvColors={colors}>
          <TemplatePhotoContent
            photo={photo}
            initials={initials}
            alt={fullName}
          />
        </SExecutiveTemplatePhoto>
        {fullName && (
          <SExecutiveTemplateName>{fullName}</SExecutiveTemplateName>
        )}
      </SExecutiveTemplateHeader>
      <SExecutiveTemplateColumns>
        <SExecutiveTemplateAside
          cvColors={colors}
          basis={getSectionSize(sizes, "columns", "aside", 34)}
        >
          {renderList("Contact", contact)}
          {renderSection(
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
            "Interests",
            interests.length > 0,
            <TemplateInlineList items={interests} separator=" · " />,
          )}
          {renderList("Social Media", socials)}
        </SExecutiveTemplateAside>
        <SExecutiveTemplateMain
          cvColors={colors}
          basis={getSectionSize(sizes, "columns", "main", 66)}
        >
          {renderSection(
            "Executive Summary",
            Boolean(aboutMe),
            <SExecutiveTemplateParagraph>
              {aboutMe}
            </SExecutiveTemplateParagraph>,
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
        </SExecutiveTemplateMain>
      </SExecutiveTemplateColumns>
    </SExecutiveTemplate>
  );
};

export const executiveTemplate: TTemplate<TExecutiveTemplateColorKey> = {
  id: "executive",
  name: "Executive",
  defaultFontId: "roboto",
  colorSchemes: [
    {
      id: "corporate",
      name: "Corporate",
      colors: {
        background: "#ffffff",
        text: "#1f2937",
        header: "#1e293b",
        headerText: "#f8fafc",
        aside: "#f1f5f9",
        accent: "#3b82f6",
      },
    },
    {
      id: "charcoal",
      name: "Charcoal",
      colors: {
        background: "#ffffff",
        text: "#262626",
        header: "#262626",
        headerText: "#fafafa",
        aside: "#f5f5f4",
        accent: "#d4a017",
      },
    },
    {
      id: "emerald",
      name: "Emerald",
      colors: {
        background: "#ffffff",
        text: "#1c2b24",
        header: "#065f46",
        headerText: "#ecfdf5",
        aside: "#ecfdf5",
        accent: "#10b981",
      },
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
          size: { value: 26, min: 18, max: 36 },
        },
        { id: "body", label: "Body", size: { value: 74 } },
      ],
    },
    {
      id: "columns",
      label: "Columns",
      direction: "horizontal",
      sections: [
        { id: "aside", label: "Aside", size: { value: 34, min: 26, max: 44 } },
        { id: "main", label: "Main", size: { value: 66 } },
      ],
    },
  ],
  render: (props) => <ExecutiveTemplateCv {...props} />,
};

export default executiveTemplate;
