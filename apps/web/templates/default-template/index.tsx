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
} from "@/templates/shared";
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

  const renderSection = (title: string, show: boolean, children: ReactNode) =>
    show && (
      <SDefaultTemplateSection>
        <SDefaultTemplateHeading cvColors={colors}>
          {title}
        </SDefaultTemplateHeading>
        {children}
      </SDefaultTemplateSection>
    );

  const renderList = (title: string, entries: TTemplateEntry[]) =>
    renderSection(
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
        <SDefaultTemplatePhoto cvColors={colors}>
          <TemplatePhotoContent
            photo={photo}
            initials={initials}
            alt={fullName}
          />
        </SDefaultTemplatePhoto>
        {fullName && <SDefaultTemplateName>{fullName}</SDefaultTemplateName>}
        {renderList("Contact", contact)}
        {renderList("Social Media", socials)}
        {renderSection(
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
          "About Me",
          Boolean(aboutMe),
          <SDefaultTemplateParagraph>{aboutMe}</SDefaultTemplateParagraph>,
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
      </SDefaultTemplateMain>
    </SDefaultTemplate>
  );
};

export const defaultTemplate: TTemplate<TDefaultTemplateColorKey> = {
  id: "default",
  name: "Default",
  defaultFontId: "inter",
  colorSchemes: [
    {
      id: "navy",
      name: "Navy",
      colors: {
        background: "#ffffff",
        text: "#1f2937",
        sidebar: "#1e3a5f",
        sidebarText: "#f8fafc",
        accent: "#60a5fa",
      },
    },
    {
      id: "forest",
      name: "Forest",
      colors: {
        background: "#ffffff",
        text: "#1c2a22",
        sidebar: "#1f4d3a",
        sidebarText: "#f0fdf4",
        accent: "#86c9a4",
      },
    },
    {
      id: "burgundy",
      name: "Burgundy",
      colors: {
        background: "#fffdfb",
        text: "#2b1b1e",
        sidebar: "#6b1f2e",
        sidebarText: "#fff1f2",
        accent: "#f2a7b4",
      },
    },
    {
      id: "graphite",
      name: "Graphite",
      colors: {
        background: "#ffffff",
        text: "#262626",
        sidebar: "#2d2d2d",
        sidebarText: "#fafafa",
        accent: "#f59e0b",
      },
    },
  ],
  groups: [
    {
      id: "columns",
      label: "Columns",
      direction: "horizontal",
      sections: [
        { id: "left", label: "Left", size: { value: 40, min: 30, max: 50 } },
        { id: "right", label: "Right", size: { value: 60 } },
      ],
    },
  ],
  render: (props) => <DefaultTemplateCv {...props} />,
};

export default defaultTemplate;
