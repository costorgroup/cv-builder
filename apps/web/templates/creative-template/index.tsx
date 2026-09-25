"use client";

import type { ReactNode } from "react";
import {
  SCreativeTemplate,
  SCreativeTemplateChips,
  SCreativeTemplateHeading,
  SCreativeTemplateMain,
  SCreativeTemplateName,
  SCreativeTemplatePhoto,
  SCreativeTemplateQuote,
  SCreativeTemplateSection,
  SCreativeTemplateStrip,
  SCreativeTemplateStripHeading,
  SCreativeTemplateStripList,
} from "@/templates/creative-template/styles";
import type {
  TCreativeTemplateColorKey,
  TCreativeTemplateProps,
} from "@/templates/creative-template/types";
import {
  mutedColor,
  TemplateChips,
  TemplateEntries,
  TemplateInlineList,
  TemplateLevels,
  TemplatePhotoContent,
  useTemplateContent,
} from "@/templates/shared";
import type { TTemplate } from "@/templates/types";
import { getSectionSize } from "@/templates/utils";

const CreativeTemplateCv = ({
  colors,
  sizes,
  typography,
}: TCreativeTemplateProps) => {
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
      <SCreativeTemplateSection>
        <SCreativeTemplateHeading cvColors={colors}>
          {title}
        </SCreativeTemplateHeading>
        {children}
      </SCreativeTemplateSection>
    );

  const renderStripSection = (
    title: string,
    show: boolean,
    children: ReactNode,
  ) =>
    show && (
      <SCreativeTemplateSection>
        <SCreativeTemplateStripHeading cvColors={colors}>
          {title}
        </SCreativeTemplateStripHeading>
        {children}
      </SCreativeTemplateSection>
    );

  return (
    <SCreativeTemplate cvColors={colors} typography={typography}>
      <SCreativeTemplateStrip
        cvColors={colors}
        basis={getSectionSize(sizes, "columns", "strip", 36)}
      >
        <SCreativeTemplatePhoto cvColors={colors}>
          <TemplatePhotoContent
            photo={photo}
            initials={initials}
            alt={fullName}
          />
        </SCreativeTemplatePhoto>
        <SCreativeTemplateName cvColors={colors}>
          {firstName}
          <span>{lastName}</span>
        </SCreativeTemplateName>
        {renderStripSection(
          "Get in touch",
          contact.length > 0,
          <SCreativeTemplateStripList>
            {contact.map(({ label, value }) => (
              <li key={label}>{value}</li>
            ))}
          </SCreativeTemplateStripList>,
        )}
        {renderStripSection(
          "Languages",
          languages.length > 0,
          <TemplateLevels
            items={languages}
            variant="dots"
            color={colors.accent}
            trackColor={mutedColor(colors.stripText, 30)}
          />,
        )}
        {renderStripSection(
          "Interests",
          interests.length > 0,
          <TemplateInlineList items={interests} separator=", " />,
        )}
      </SCreativeTemplateStrip>
      <SCreativeTemplateMain
        cvColors={colors}
        basis={getSectionSize(sizes, "columns", "main", 64)}
      >
        {aboutMe && (
          <SCreativeTemplateQuote cvColors={colors}>
            {aboutMe}
          </SCreativeTemplateQuote>
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
          "Skills",
          skills.length > 0,
          <TemplateChips
            items={skills}
            background={colors.strip}
            color={colors.text}
            outline
          />,
        )}
        {renderSection(
          "Certificates",
          certificates.length > 0,
          <TemplateEntries items={certificates} />,
        )}
        {renderSection(
          "Find me online",
          socials.length > 0,
          <SCreativeTemplateChips cvColors={colors}>
            {socials.map(({ label, value }) => (
              <li key={label}>
                <strong>{label}</strong>
                {value}
              </li>
            ))}
          </SCreativeTemplateChips>,
        )}
      </SCreativeTemplateMain>
    </SCreativeTemplate>
  );
};

export const creativeTemplate: TTemplate<TCreativeTemplateColorKey> = {
  id: "creative",
  name: "Creative",
  defaultFontId: "playfair-display",
  colorSchemes: [
    {
      id: "coral",
      name: "Coral",
      colors: {
        background: "#fffaf7",
        text: "#2d1f1a",
        strip: "#e2574c",
        stripText: "#fff4ef",
        accent: "#ffd166",
      },
    },
    {
      id: "violet",
      name: "Violet",
      colors: {
        background: "#fbfaff",
        text: "#221d33",
        strip: "#5b3cc4",
        stripText: "#f3f0ff",
        accent: "#f472b6",
      },
    },
    {
      id: "mustard",
      name: "Mustard",
      colors: {
        background: "#fffdf5",
        text: "#29251a",
        strip: "#d99a0b",
        stripText: "#1f1a0e",
        accent: "#1f1a0e",
      },
    },
    {
      id: "teal",
      name: "Teal",
      colors: {
        background: "#f7fdfc",
        text: "#15302c",
        strip: "#0f766e",
        stripText: "#f0fdfa",
        accent: "#fb923c",
      },
    },
    {
      id: "rose",
      name: "Rose",
      colors: {
        background: "#fff8f9",
        text: "#3a1f27",
        strip: "#be185d",
        stripText: "#fff1f5",
        accent: "#fda4af",
      },
    },
  ],
  groups: [
    {
      id: "columns",
      label: "Columns",
      direction: "horizontal",
      sections: [
        { id: "strip", label: "Strip", size: { value: 36, min: 28, max: 46 } },
        { id: "main", label: "Main", size: { value: 64 } },
      ],
    },
  ],
  render: (props) => <CreativeTemplateCv {...props} />,
};

export default creativeTemplate;
