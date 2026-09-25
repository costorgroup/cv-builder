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
} from "@/templates/shared";
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

  const renderSection = (title: string, show: boolean, children: ReactNode) =>
    show && (
      <SModernTemplateSection>
        <SModernTemplateHeading cvColors={colors}>
          {title}
        </SModernTemplateHeading>
        {children}
      </SModernTemplateSection>
    );

  const renderList = (title: string, entries: TTemplateEntry[]) =>
    renderSection(
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
        <SModernTemplateName cvColors={colors}>
          {firstName}
          <span>{lastName}</span>
        </SModernTemplateName>
        {renderSection(
          "About Me",
          Boolean(aboutMe),
          <SModernTemplateParagraph>{aboutMe}</SModernTemplateParagraph>,
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
      </SModernTemplateMain>
      <SModernTemplateSidebar
        cvColors={colors}
        basis={getSectionSize(sizes, "columns", "sidebar", 36)}
      >
        <SModernTemplatePhoto cvColors={colors}>
          <TemplatePhotoContent
            photo={photo}
            initials={initials}
            alt={fullName}
          />
        </SModernTemplatePhoto>
        {renderList("Contact", contact)}
        {renderList("Social Media", socials)}
        {renderSection(
          "Skills",
          skills.length > 0,
          <TemplateChips
            items={skills}
            background={colors.accent}
            color={colors.sidebar}
          />,
        )}
        {renderSection(
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
          "Interests",
          interests.length > 0,
          <TemplateChips
            items={interests}
            background={colors.accent}
            color={colors.sidebar}
          />,
        )}
        {renderSection(
          "Certificates",
          certificates.length > 0,
          <TemplateEntries items={certificates} />,
        )}
      </SModernTemplateSidebar>
    </SModernTemplate>
  );
};

export const modernTemplate: TTemplate<TModernTemplateColorKey> = {
  id: "modern",
  name: "Modern",
  defaultFontId: "montserrat",
  colorSchemes: [
    {
      id: "ocean",
      name: "Ocean",
      colors: {
        background: "#ffffff",
        text: "#0f172a",
        sidebar: "#0e7490",
        sidebarText: "#ecfeff",
        accent: "#06b6d4",
      },
    },
    {
      id: "slate",
      name: "Slate",
      colors: {
        background: "#ffffff",
        text: "#1e293b",
        sidebar: "#e2e8f0",
        sidebarText: "#1e293b",
        accent: "#475569",
      },
    },
    {
      id: "sunset",
      name: "Sunset",
      colors: {
        background: "#fffbf5",
        text: "#292524",
        sidebar: "#9a3412",
        sidebarText: "#fff7ed",
        accent: "#f97316",
      },
    },
  ],
  groups: [
    {
      id: "columns",
      label: "Columns",
      direction: "horizontal",
      sections: [
        { id: "main", label: "Main", size: { value: 64, min: 55, max: 72 } },
        { id: "sidebar", label: "Sidebar", size: { value: 36 } },
      ],
    },
  ],
  render: (props) => <ModernTemplateCv {...props} />,
};

export default modernTemplate;
