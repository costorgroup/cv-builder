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
  TemplateInlineList,
  TemplateLevels,
  TemplatePhotoContent,
  useTemplateContent,
  type TTemplateEntry,
} from "@/templates/shared";
import { timelineTemplateSpec } from "@repo/cv-core";
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
    interests,
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
          {renderItem(
            "Interests",
            interests.length > 0,
            <TemplateInlineList items={interests} separator=" · " />,
          )}
          {renderList("Contact", contact)}
          {renderList("Social Media", socials)}
        </STimelineTemplateTrack>
      </STimelineTemplateBody>
    </STimelineTemplate>
  );
};

export const timelineTemplate: TTemplate<TTimelineTemplateColorKey> = {
  ...timelineTemplateSpec,
  render: (props) => <TimelineTemplateCv {...props} />,
};

export default timelineTemplate;
