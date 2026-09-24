"use client";

import { Fragment, type ReactNode } from "react";
import {
  STimelineTemplate,
  STimelineTemplateBody,
  STimelineTemplateHeader,
  STimelineTemplateHeading,
  STimelineTemplateItem,
  STimelineTemplateList,
  STimelineTemplateName,
  STimelineTemplateParagraph,
  STimelineTemplatePhoto,
  STimelineTemplateTrack,
} from "@/templates/timeline-template/styles";
import type {
  TTimelineTemplateColorKey,
  TTimelineTemplateProps,
} from "@/templates/timeline-template/types";
import {
  TemplateEntries,
  TemplateLevels,
  TemplatePhotoContent,
  useTemplateContent,
  type TTemplateEntry,
} from "@/templates/shared";
import type { TTemplate } from "@/templates/types";
import { getSectionSize } from "@/templates/utils";

const TimelineTemplateCv = ({
  colors,
  sizes,
  typography,
}: TTimelineTemplateProps) => {
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

  // Every section is a stop on the timeline.
  const renderItem = (title: string, show: boolean, children: ReactNode) =>
    show && (
      <STimelineTemplateItem cvColors={colors}>
        <STimelineTemplateHeading cvColors={colors}>
          {title}
        </STimelineTemplateHeading>
        {children}
      </STimelineTemplateItem>
    );

  const renderList = (title: string, entries: TTemplateEntry[]) =>
    renderItem(
      title,
      entries.length > 0,
      <STimelineTemplateList>
        {entries.map(({ label, value }) => (
          <Fragment key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </STimelineTemplateList>,
    );

  return (
    <STimelineTemplate cvColors={colors} typography={typography}>
      <STimelineTemplateHeader
        cvColors={colors}
        basis={getSectionSize(sizes, "rows", "header", 22)}
      >
        <STimelineTemplatePhoto cvColors={colors}>
          <TemplatePhotoContent
            photo={photo}
            initials={initials}
            alt={fullName}
          />
        </STimelineTemplatePhoto>
        {fullName && <STimelineTemplateName>{fullName}</STimelineTemplateName>}
      </STimelineTemplateHeader>
      <STimelineTemplateBody
        cvColors={colors}
        basis={getSectionSize(sizes, "rows", "body", 78)}
      >
        <STimelineTemplateTrack cvColors={colors}>
          {renderItem(
            "About Me",
            Boolean(aboutMe),
            <STimelineTemplateParagraph>{aboutMe}</STimelineTemplateParagraph>,
          )}
          {renderItem(
            "Experience",
            experience.length > 0,
            <TemplateEntries items={experience} />,
          )}
          {renderItem(
            "Education",
            education.length > 0,
            <TemplateEntries items={education} />,
          )}
          {renderItem(
            "Projects",
            projects.length > 0,
            <TemplateEntries items={projects} />,
          )}
          {renderItem(
            "Certificates",
            certificates.length > 0,
            <TemplateEntries items={certificates} />,
          )}
          {renderItem(
            "Skills",
            skills.length > 0,
            <TemplateLevels
              items={skills}
              variant="bar"
              color={colors.accent}
              trackColor={colors.line}
            />,
          )}
          {renderItem(
            "Languages",
            languages.length > 0,
            <TemplateLevels
              items={languages}
              variant="text"
              color={colors.accent}
              trackColor={colors.line}
            />,
          )}
          {renderList("Contact", contact)}
          {renderList("Social Media", socials)}
        </STimelineTemplateTrack>
      </STimelineTemplateBody>
    </STimelineTemplate>
  );
};

export const timelineTemplate: TTemplate<TTimelineTemplateColorKey> = {
  id: "timeline",
  name: "Timeline",
  defaultFontId: "montserrat",
  colorSchemes: [
    {
      id: "azure",
      name: "Azure",
      colors: {
        background: "#ffffff",
        text: "#1f2937",
        header: "#1d4ed8",
        headerText: "#eff6ff",
        accent: "#2563eb",
        line: "#bfdbfe",
      },
    },
    {
      id: "graphite",
      name: "Graphite",
      colors: {
        background: "#ffffff",
        text: "#27272a",
        header: "#3f3f46",
        headerText: "#fafafa",
        accent: "#52525b",
        line: "#d4d4d8",
      },
    },
    {
      id: "plum",
      name: "Plum",
      colors: {
        background: "#fffbfe",
        text: "#2e1f2c",
        header: "#6b2160",
        headerText: "#fdf2fa",
        accent: "#a21caf",
        line: "#f0c5e9",
      },
    },
    {
      id: "olive",
      name: "Olive",
      colors: {
        background: "#fcfcf7",
        text: "#2a2d1f",
        header: "#4d5b23",
        headerText: "#f7f9ec",
        accent: "#65a30d",
        line: "#d9e5b6",
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
          size: { value: 22, min: 15, max: 30 },
        },
        { id: "body", label: "Body", size: { value: 78 } },
      ],
    },
  ],
  render: (props) => <TimelineTemplateCv {...props} />,
};

export default timelineTemplate;
