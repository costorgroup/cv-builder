"use client";

import { Fragment, type ReactNode } from "react";
import {
  SColumnsTemplate,
  SColumnsTemplateColumn,
  SColumnsTemplateColumns,
  SColumnsTemplateHeader,
  SColumnsTemplateHeading,
  SColumnsTemplateList,
  SColumnsTemplateName,
  SColumnsTemplateParagraph,
  SColumnsTemplatePhoto,
  SColumnsTemplateSection,
} from "@/templates/columns-template/styles";
import type {
  TColumnsTemplateColorKey,
  TColumnsTemplateProps,
} from "@/templates/columns-template/types";
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

const ColumnsTemplateCv = ({
  colors,
  sizes,
  typography,
}: TColumnsTemplateProps) => {
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
  } = useTemplateContent();

  const renderSection = (title: string, show: boolean, children: ReactNode) =>
    show && (
      <SColumnsTemplateSection>
        <SColumnsTemplateHeading cvColors={colors}>
          {title}
        </SColumnsTemplateHeading>
        {children}
      </SColumnsTemplateSection>
    );

  const renderList = (title: string, entries: TTemplateEntry[]) =>
    renderSection(
      title,
      entries.length > 0,
      <SColumnsTemplateList>
        {entries.map(({ label, value }) => (
          <Fragment key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </SColumnsTemplateList>,
    );

  return (
    <SColumnsTemplate cvColors={colors} typography={typography}>
      <SColumnsTemplateHeader cvColors={colors}>
        <SColumnsTemplatePhoto cvColors={colors}>
          <TemplatePhotoContent
            photo={photo}
            initials={initials}
            alt={fullName}
          />
        </SColumnsTemplatePhoto>
        {fullName && <SColumnsTemplateName>{fullName}</SColumnsTemplateName>}
      </SColumnsTemplateHeader>
      <SColumnsTemplateColumns>
        <SColumnsTemplateColumn
          cvColors={colors}
          basis={getSectionSize(sizes, "columns", "profile", 38)}
        >
          {renderSection(
            "Profile",
            Boolean(aboutMe),
            <SColumnsTemplateParagraph>{aboutMe}</SColumnsTemplateParagraph>,
          )}
          {renderSection(
            "Experience",
            experience.length > 0,
            <TemplateEntries items={experience} />,
          )}
        </SColumnsTemplateColumn>
        <SColumnsTemplateColumn
          cvColors={colors}
          basis={getSectionSize(sizes, "columns", "contact", 32)}
        >
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
        </SColumnsTemplateColumn>
        <SColumnsTemplateColumn
          cvColors={colors}
          basis={getSectionSize(sizes, "columns", "links", 30)}
        >
          {renderList("Contact", contact)}
          {renderSection(
            "Skills",
            skills.length > 0,
            <TemplateChips
              items={skills}
              background={mutedColor(colors.accent, 25)}
              color={colors.text}
            />,
          )}
          {renderSection(
            "Languages",
            languages.length > 0,
            <TemplateLevels
              items={languages}
              variant="bar"
              color={colors.accent}
              trackColor={mutedColor(colors.accent, 20)}
            />,
          )}
          {renderList("Links", socials)}
        </SColumnsTemplateColumn>
      </SColumnsTemplateColumns>
    </SColumnsTemplate>
  );
};

export const columnsTemplate: TTemplate<TColumnsTemplateColorKey> = {
  id: "columns",
  name: "Columns",
  defaultFontId: "inter",
  colorSchemes: [
    {
      id: "nordic",
      name: "Nordic",
      colors: {
        background: "#ffffff",
        text: "#1f2a37",
        header: "#243b53",
        headerText: "#f0f4f8",
        accent: "#829ab1",
      },
    },
    {
      id: "sand",
      name: "Sand",
      colors: {
        background: "#fdfbf7",
        text: "#3d3426",
        header: "#e7dcc8",
        headerText: "#3d3426",
        accent: "#b08d57",
      },
    },
  ],
  groups: [
    {
      id: "columns",
      label: "Columns",
      direction: "horizontal",
      sections: [
        {
          id: "profile",
          label: "Profile",
          size: { value: 38, min: 28, max: 46 },
        },
        {
          id: "contact",
          label: "Contact",
          size: { value: 32, min: 22, max: 40 },
        },
        { id: "links", label: "Links", size: { value: 30, min: 20, max: 40 } },
      ],
    },
  ],
  render: (props) => <ColumnsTemplateCv {...props} />,
};

export default columnsTemplate;
