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
  cvStep,
  type TTemplateStep,
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
  const renderItem = (
    step: TTemplateStep,
    title: string,
    show: boolean,
    children: ReactNode,
  ) =>
    show && (
      <STimelineTemplateItem {...cvStep(step)} cvColors={colors}>
        <STimelineTemplateHeading cvColors={colors}>
          {title}
        </STimelineTemplateHeading>
        {children}
      </STimelineTemplateItem>
    );

  const renderList = (
    step: TTemplateStep,
    title: string,
    entries: TTemplateEntry[],
  ) =>
    renderItem(
      step,
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
        <STimelineTemplatePhoto
          {...cvStep("personal-information")}
          cvColors={colors}
        >
          <TemplatePhotoContent
            photo={photo}
            initials={initials}
            alt={fullName}
          />
        </STimelineTemplatePhoto>
        {fullName && (
          <STimelineTemplateName {...cvStep("personal-information")}>
            {fullName}
          </STimelineTemplateName>
        )}
      </STimelineTemplateHeader>
      <STimelineTemplateBody
        cvColors={colors}
        basis={getSectionSize(sizes, "rows", "body", 78)}
      >
        <STimelineTemplateTrack cvColors={colors}>
          {renderItem(
            "personal-information",
            "About Me",
            Boolean(aboutMe),
            <STimelineTemplateParagraph>{aboutMe}</STimelineTemplateParagraph>,
          )}
          {renderItem(
            "work-experience",
            "Experience",
            experience.length > 0,
            <TemplateEntries items={experience} />,
          )}
          {renderItem(
            "education",
            "Education",
            education.length > 0,
            <TemplateEntries items={education} />,
          )}
          {renderItem(
            "projects",
            "Projects",
            projects.length > 0,
            <TemplateEntries items={projects} />,
          )}
          {renderItem(
            "certificates",
            "Certificates",
            certificates.length > 0,
            <TemplateEntries items={certificates} />,
          )}
          {renderItem(
            "skills",
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
            "languages",
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
            "interests",
            "Interests",
            interests.length > 0,
            <TemplateInlineList items={interests} separator=" · " />,
          )}
          {renderList("personal-information", "Contact", contact)}
          {renderList("social-media", "Social Media", socials)}
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
