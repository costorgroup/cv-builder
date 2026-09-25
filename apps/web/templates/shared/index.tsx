"use client";

import { useCvData } from "@/providers/cv-provider/context";
import {
  languageLevelLabel,
  skillLevelLabel,
} from "@/providers/cv-provider/items";
import type { TCvSocialMedia } from "@/providers/cv-provider/types";

export type TTemplateEntry = { label: string; value: string };

/** Work experience, education, project or certificate, ready to render. */
export type TTemplateItem = {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  description: string;
};

/** Something listed by name only, like an interest. */
export type TTemplateNamedItem = {
  id: string;
  name: string;
  /** Shown as a tooltip where there is one (e.g. a skill's level). */
  levelLabel?: string;
};

/** Skill or language with its level. */
export type TTemplateLevelItem = {
  id: string;
  name: string;
  level: number;
  levelLabel: string;
};

const socialMediaLabels: Record<keyof TCvSocialMedia, string> = {
  linkedin: "LinkedIn",
  github: "GitHub",
  website: "Website",
  twitter: "Twitter",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
};

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** `2021-03-15` or `2021-03` → `Mar 2021`. Anything else is returned as typed. */
export const formatMonth = (value: string) => {
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(value.trim());
  const month = match && monthNames[Number(match[2]) - 1];
  return match && month ? `${month} ${match[1]}` : value.trim();
};

export const formatDateRange = (
  startDate: string,
  endDate: string,
  current = false,
) => {
  const start = formatMonth(startDate);
  const end = current ? "Present" : formatMonth(endDate);
  if (start && end) return `${start} – ${end}`;
  return start || end;
};

/** "New York City, New York 10001, United States"; empty parts left out. */
const formatLocation = (
  city: string,
  state: string,
  zip: string,
  country: string,
) => {
  const region = [state, zip]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
  return [city, region, country]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
};

const joinParts = (...parts: string[]) =>
  parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" · ");

/** CV data in the shape templates render: names joined, empty fields dropped. */
export const useTemplateContent = () => {
  const {
    personalInformation,
    socialMedia,
    workExperience,
    education,
    skills,
    languages,
    projects,
    certificates,
    interests,
  } = useCvData();
  const {
    firstName,
    lastName,
    aboutMe,
    photo,
    email,
    phone,
    country,
    state,
    city,
    zip,
  } = personalInformation;

  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const initials = [firstName, lastName]
    .map((name) => name.trim().charAt(0))
    .join("")
    .toUpperCase();

  const contact: TTemplateEntry[] = [
    { label: "Email", value: email },
    { label: "Phone", value: phone },
    { label: "Location", value: formatLocation(city, state, zip, country) },
  ].filter(({ value }) => value);

  const socials: TTemplateEntry[] = (
    Object.keys(socialMediaLabels) as (keyof TCvSocialMedia)[]
  )
    .map((key) => ({ label: socialMediaLabels[key], value: socialMedia[key] }))
    .filter(({ value }) => value);

  // Entries without a title are still being filled in, so they are skipped.
  const withTitle = (item: TTemplateItem) => Boolean(item.title.trim());

  const experience: TTemplateItem[] = workExperience
    .map((item) => ({
      id: item.id,
      title: item.position,
      subtitle: joinParts(item.company, item.location),
      date: formatDateRange(item.startDate, item.endDate, item.current),
      description: item.description,
    }))
    .filter(withTitle);

  const educationItems: TTemplateItem[] = education
    .map((item) => ({
      id: item.id,
      title: item.degree,
      subtitle: joinParts(item.institution, item.location),
      date: formatDateRange(item.startDate, item.endDate, item.current),
      description: item.description,
    }))
    .filter(withTitle);

  const projectItems: TTemplateItem[] = projects
    .map((item) => ({
      id: item.id,
      title: item.name,
      subtitle: joinParts(item.role, item.url),
      date: formatDateRange(item.startDate, item.endDate),
      description: item.description,
    }))
    .filter(withTitle);

  const certificateItems: TTemplateItem[] = certificates
    .map((item) => ({
      id: item.id,
      title: item.name,
      subtitle: joinParts(item.issuer, item.url),
      date: formatMonth(item.date),
      description: "",
    }))
    .filter(withTitle);

  const skillItems: TTemplateLevelItem[] = skills
    .filter((item) => item.name.trim())
    .map((item) => ({ ...item, levelLabel: skillLevelLabel(item.level) }));

  const languageItems: TTemplateLevelItem[] = languages
    .filter((item) => item.name.trim())
    .map((item) => ({ ...item, levelLabel: languageLevelLabel(item.level) }));

  const interestItems: TTemplateNamedItem[] = interests.filter((item) =>
    item.name.trim(),
  );

  return {
    firstName,
    lastName,
    fullName,
    initials,
    aboutMe,
    photo,
    contact,
    socials,
    experience,
    education: educationItems,
    projects: projectItems,
    certificates: certificateItems,
    skills: skillItems,
    languages: languageItems,
    interests: interestItems,
  };
};

/** The photo if there is one, otherwise the initials. Style the wrapper. */
export const TemplatePhotoContent = ({
  photo,
  initials,
  alt,
}: {
  photo: string;
  initials: string;
  alt: string;
}) =>
  photo ? (
    // Photo is a user upload (data/blob URL), not a static asset.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo}
      alt={alt}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  ) : (
    <>{initials}</>
  );

export * from "@/templates/shared/blocks";
export {
  mutedColor,
  templateBlocksCss,
  templateTypographyCss,
} from "@/templates/shared/styles";
