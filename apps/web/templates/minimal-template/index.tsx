"use client";

import { Fragment, type ReactNode } from "react";
import {
  SMinimalTemplate,
  SMinimalTemplateContent,
  SMinimalTemplateLabel,
  SMinimalTemplateList,
  SMinimalTemplateName,
  SMinimalTemplateParagraph,
  SMinimalTemplateRows,
} from "@/templates/minimal-template/styles";
import type {
  TMinimalTemplateColorKey,
  TMinimalTemplateProps,
} from "@/templates/minimal-template/types";
import {
  mutedColor,
  TemplateEntries,
  TemplateInlineList,
  TemplateLevels,
  useTemplateContent,
  type TTemplateEntry,
} from "@/templates/shared";
import type { TTemplate } from "@/templates/types";
import { getSectionSize } from "@/templates/utils";

const MinimalTemplateCv = ({
  colors,
  sizes,
  typography,
}: TMinimalTemplateProps) => {
  const {
    firstName,
    lastName,
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

  // One grid row: the label on the left, the content on the right.
  const renderRow = (title: string, show: boolean, children: ReactNode) =>
    show && (
      <>
        <SMinimalTemplateLabel cvColors={colors}>{title}</SMinimalTemplateLabel>
        <SMinimalTemplateContent cvColors={colors}>
          {children}
        </SMinimalTemplateContent>
      </>
    );

  const renderList = (title: string, entries: TTemplateEntry[]) =>
    renderRow(
      title,
      entries.length > 0,
      <SMinimalTemplateList cvColors={colors}>
        {entries.map(({ label, value }) => (
          <Fragment key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </SMinimalTemplateList>,
    );

  return (
    <SMinimalTemplate cvColors={colors} typography={typography}>
      <SMinimalTemplateName cvColors={colors}>
        {firstName} <strong>{lastName}</strong>
      </SMinimalTemplateName>
      <SMinimalTemplateRows
        labelsEnd={getSectionSize(sizes, "columns", "labels", 30)}
      >
        {renderRow(
          "About",
          Boolean(aboutMe),
          <SMinimalTemplateParagraph>{aboutMe}</SMinimalTemplateParagraph>,
        )}
        {renderRow(
          "Experience",
          experience.length > 0,
          <TemplateEntries items={experience} />,
        )}
        {renderRow(
          "Education",
          education.length > 0,
          <TemplateEntries items={education} />,
        )}
        {renderRow(
          "Projects",
          projects.length > 0,
          <TemplateEntries items={projects} />,
        )}
        {renderRow(
          "Certificates",
          certificates.length > 0,
          <TemplateEntries items={certificates} />,
        )}
        {renderRow(
          "Skills",
          skills.length > 0,
          <TemplateInlineList items={skills} separator=" / " />,
        )}
        {renderRow(
          "Languages",
          languages.length > 0,
          <TemplateLevels
            items={languages}
            variant="dots"
            color={colors.accent}
            trackColor={mutedColor(colors.muted, 35)}
          />,
        )}
        {renderList("Contact", contact)}
        {renderList("Social", socials)}
      </SMinimalTemplateRows>
    </SMinimalTemplate>
  );
};

export const minimalTemplate: TTemplate<TMinimalTemplateColorKey> = {
  id: "minimal",
  name: "Minimal",
  defaultFontId: "lato",
  colorSchemes: [
    {
      id: "mono",
      name: "Mono",
      colors: {
        background: "#ffffff",
        text: "#171717",
        muted: "#737373",
        accent: "#171717",
      },
    },
    {
      id: "blue-ink",
      name: "Blue Ink",
      colors: {
        background: "#ffffff",
        text: "#1e293b",
        muted: "#64748b",
        accent: "#2563eb",
      },
    },
    {
      id: "sage",
      name: "Sage",
      colors: {
        background: "#fafaf7",
        text: "#27302a",
        muted: "#6b7a6f",
        accent: "#5f8a6b",
      },
    },
    {
      id: "clay",
      name: "Clay",
      colors: {
        background: "#fdfaf7",
        text: "#3a2a22",
        muted: "#8c7466",
        accent: "#c2410c",
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
          id: "labels",
          label: "Labels",
          size: { value: 30, min: 22, max: 40 },
        },
        { id: "content", label: "Content", size: { value: 70 } },
      ],
    },
  ],
  render: (props) => <MinimalTemplateCv {...props} />,
};

export default minimalTemplate;
