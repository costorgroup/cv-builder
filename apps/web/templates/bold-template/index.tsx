"use client";

import { Fragment, type ReactNode } from "react";
import {
  SBoldTemplate,
  SBoldTemplateBody,
  SBoldTemplateHeading,
  SBoldTemplateHero,
  SBoldTemplateList,
  SBoldTemplateName,
  SBoldTemplateParagraph,
  SBoldTemplatePhoto,
  SBoldTemplateSection,
  SBoldTemplateWideSection,
} from "@/templates/bold-template/styles";
import type {
  TBoldTemplateColorKey,
  TBoldTemplateProps,
} from "@/templates/bold-template/types";
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

const BoldTemplateCv = ({ colors, sizes, typography }: TBoldTemplateProps) => {
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

  // Wide sections span both body columns.
  const renderSection = (
    title: string,
    show: boolean,
    children: ReactNode,
    wide = false,
  ) => {
    if (!show) return null;
    const Section = wide ? SBoldTemplateWideSection : SBoldTemplateSection;
    return (
      <Section>
        <SBoldTemplateHeading cvColors={colors}>{title}</SBoldTemplateHeading>
        {children}
      </Section>
    );
  };

  const renderList = (title: string, entries: TTemplateEntry[]) =>
    renderSection(
      title,
      entries.length > 0,
      <SBoldTemplateList>
        {entries.map(({ label, value }) => (
          <Fragment key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </SBoldTemplateList>,
    );

  return (
    <SBoldTemplate cvColors={colors} typography={typography}>
      <SBoldTemplateHero
        cvColors={colors}
        basis={getSectionSize(sizes, "rows", "hero", 36)}
      >
        {fullName && <SBoldTemplateName>{fullName}</SBoldTemplateName>}
        <SBoldTemplatePhoto cvColors={colors}>
          <TemplatePhotoContent
            photo={photo}
            initials={initials}
            alt={fullName}
          />
        </SBoldTemplatePhoto>
      </SBoldTemplateHero>
      <SBoldTemplateBody
        cvColors={colors}
        basis={getSectionSize(sizes, "rows", "body", 64)}
      >
        {renderSection(
          "About",
          Boolean(aboutMe),
          <SBoldTemplateParagraph>{aboutMe}</SBoldTemplateParagraph>,
          true,
        )}
        {renderSection(
          "Experience",
          experience.length > 0,
          <TemplateEntries items={experience} />,
          true,
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
          "Skills",
          skills.length > 0,
          <TemplateChips
            items={skills}
            background={colors.hero}
            color={colors.heroText}
          />,
        )}
        {renderSection(
          "Languages",
          languages.length > 0,
          <TemplateLevels
            items={languages}
            variant="dots"
            color={colors.text}
            trackColor={mutedColor(colors.text, 18)}
          />,
        )}
        {renderSection(
          "Interests",
          interests.length > 0,
          <TemplateChips
            items={interests}
            background={colors.hero}
            color={colors.heroText}
          />,
        )}
        {renderSection(
          "Certificates",
          certificates.length > 0,
          <TemplateEntries items={certificates} />,
        )}
        {renderList("Contact", contact)}
        {renderList("Social", socials)}
      </SBoldTemplateBody>
    </SBoldTemplate>
  );
};

export const boldTemplate: TTemplate<TBoldTemplateColorKey> = {
  id: "bold",
  name: "Bold",
  defaultFontId: "inter",
  colorSchemes: [
    {
      id: "electric",
      name: "Electric",
      colors: {
        background: "#ffffff",
        text: "#0a0a0a",
        hero: "#2f3cff",
        heroText: "#ffffff",
      },
    },
    {
      id: "lime",
      name: "Lime",
      colors: {
        background: "#ffffff",
        text: "#111111",
        hero: "#c6f432",
        heroText: "#111111",
      },
    },
    {
      id: "tomato",
      name: "Tomato",
      colors: {
        background: "#fffaf8",
        text: "#1c1210",
        hero: "#f0452b",
        heroText: "#fff5f2",
      },
    },
    {
      id: "noir",
      name: "Noir",
      colors: {
        background: "#ffffff",
        text: "#0a0a0a",
        hero: "#0a0a0a",
        heroText: "#ffffff",
      },
    },
  ],
  groups: [
    {
      id: "rows",
      label: "Rows",
      direction: "vertical",
      sections: [
        { id: "hero", label: "Hero", size: { value: 36, min: 26, max: 46 } },
        { id: "body", label: "Body", size: { value: 64 } },
      ],
    },
  ],
  render: (props) => <BoldTemplateCv {...props} />,
};

export default boldTemplate;
