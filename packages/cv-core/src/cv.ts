import type { TTemplateSizes } from "./templates/types.js";

export type TCvPersonalInformation = {
  firstName: string;
  lastName: string;
  aboutMe: string;
  photo: string;
  email: string;
  phone: string;
  /** Location, as picked from the API's country/state/city lists. */
  country: string;
  state: string;
  city: string;
  zip: string;
};

export type TCvSocialMedia = {
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  youtube: string;
  github: string;
  website: string;
};

/** Dates are `YYYY-MM-DD` strings (`YYYY-MM` also works); empty when not set. */
export type TCvWorkExperience = {
  id: string;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
};

export type TCvEducation = {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
};

/** `level` goes from 1 to `CV_LEVEL_MAX`. */
export type TCvSkill = {
  id: string;
  name: string;
  level: number;
};

export type TCvLanguage = {
  id: string;
  name: string;
  level: number;
};

export type TCvProject = {
  id: string;
  name: string;
  role: string;
  url: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type TCvCertificate = {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
};

/** A hobby or interest, e.g. "Photography". */
export type TCvInterest = {
  id: string;
  name: string;
};

export type TCvData = {
  personalInformation: TCvPersonalInformation;
  socialMedia: TCvSocialMedia;
  workExperience: TCvWorkExperience[];
  education: TCvEducation[];
  skills: TCvSkill[];
  languages: TCvLanguage[];
  projects: TCvProject[];
  certificates: TCvCertificate[];
  interests: TCvInterest[];
};

/** Sections that hold a single set of fields. */
export type TCvObjectKey = "personalInformation" | "socialMedia";

/** Sections that hold a list of entries. */
export type TCvListKey = Exclude<keyof TCvData, TCvObjectKey>;

export type TCvListItem<K extends TCvListKey> = TCvData[K][number];

/** How the CV looks: everything picked on the Templates and Appearance steps. */
export type TCvAppearance = {
  templateId: string;
  colorSchemeId: string;
  sizes: TTemplateSizes;
  /** Font id from `CV_FONTS`. */
  fontId: string;
  fontScale: number;
};

/** Everything needed to render a CV somewhere else (e.g. for the PDF). */
export type TCvDocument = {
  data: TCvData;
  appearance: TCvAppearance;
};
