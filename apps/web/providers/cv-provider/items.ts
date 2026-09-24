import type {
  TCvData,
  TCvListItem,
  TCvListKey,
} from "@/providers/cv-provider/types";

/** Highest skill/language level. Levels go from 1 to this. */
export const CV_LEVEL_MAX = 5;

/** Every level, lowest first (for level pickers). */
export const CV_LEVELS = Array.from(
  { length: CV_LEVEL_MAX },
  (_, index) => index + 1,
);

const skillLevelLabels = [
  "Beginner",
  "Basic",
  "Intermediate",
  "Advanced",
  "Expert",
];
const languageLevelLabels = [
  "Beginner",
  "Elementary",
  "Intermediate",
  "Fluent",
  "Native",
];

const levelLabel = (labels: string[], level: number) =>
  labels[Math.min(Math.max(Math.round(level), 1), CV_LEVEL_MAX) - 1] ?? "";

export const skillLevelLabel = (level: number) =>
  levelLabel(skillLevelLabels, level);

export const languageLevelLabel = (level: number) =>
  levelLabel(languageLevelLabels, level);

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const emptyItems: { [K in TCvListKey]: () => Omit<TCvListItem<K>, "id"> } = {
  workExperience: () => ({
    position: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  }),
  education: () => ({
    degree: "",
    institution: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  }),
  skills: () => ({ name: "", level: 3 }),
  languages: () => ({ name: "", level: 3 }),
  projects: () => ({
    name: "",
    role: "",
    url: "",
    startDate: "",
    endDate: "",
    description: "",
  }),
  certificates: () => ({ name: "", issuer: "", date: "", url: "" }),
};

export const createCvItem = <K extends TCvListKey>(key: K): TCvListItem<K> =>
  ({ id: createId(), ...emptyItems[key]() }) as TCvListItem<K>;

export const emptyCvData: TCvData = {
  personalInformation: {
    firstName: "",
    lastName: "",
    aboutMe: "",
    photo: "",
    email: "",
    phone: "",
    address: "",
  },
  socialMedia: {
    facebook: "",
    instagram: "",
    twitter: "",
    linkedin: "",
    youtube: "",
    github: "",
    website: "",
  },
  workExperience: [],
  education: [],
  skills: [],
  languages: [],
  projects: [],
  certificates: [],
};
