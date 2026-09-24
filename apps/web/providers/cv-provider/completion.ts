import type {
  TCvData,
  TCvListItem,
  TCvListKey,
  TCvObjectKey,
} from "@/providers/cv-provider/types";

/**
 * Fields that must be filled. Used both for form validation and for the CV
 * completion status, so the two always agree. List fields apply to every
 * entry of that list.
 */
export const cvRequiredFields: {
  [K in TCvObjectKey]: (keyof TCvData[K])[];
} & {
  [K in TCvListKey]: (keyof TCvListItem<K>)[];
} = {
  personalInformation: [
    "firstName",
    "lastName",
    "email",
    "phone",
    "address",
    "aboutMe",
  ],
  socialMedia: [],
  workExperience: ["position", "company"],
  education: ["degree", "institution"],
  skills: ["name"],
  languages: ["name"],
  projects: ["name"],
  certificates: ["name"],
};

/**
 * Fields that count towards completion, required or not. Levels always have a
 * value and `current` is a flag, so neither is counted.
 */
const countedListFields: { [K in TCvListKey]: (keyof TCvListItem<K>)[] } = {
  workExperience: [
    "position",
    "company",
    "location",
    "startDate",
    "endDate",
    "description",
  ],
  education: [
    "degree",
    "institution",
    "location",
    "startDate",
    "endDate",
    "description",
  ],
  skills: ["name"],
  languages: ["name"],
  projects: ["name", "role", "url", "startDate", "endDate", "description"],
  certificates: ["name", "issuer", "date", "url"],
};

const listKeys = Object.keys(countedListFields) as TCvListKey[];

const isFilled = (value: unknown) =>
  typeof value === "string" ? value.trim() !== "" : value != null;

export type TCvCompletion = {
  /** 0–100: every field, optional ones too, plus one entry per list. */
  percent: number;
  /** Every required field is filled. */
  requiredComplete: boolean;
};

export const getCvCompletion = (data: TCvData): TCvCompletion => {
  let total = 0;
  let filled = 0;
  let requiredComplete = true;

  const count = (value: unknown, required: boolean) => {
    total += 1;
    if (isFilled(value)) filled += 1;
    else if (required) requiredComplete = false;
  };

  for (const key of ["personalInformation", "socialMedia"] as const) {
    const required: string[] = cvRequiredFields[key];
    for (const [field, value] of Object.entries(data[key])) {
      count(value, required.includes(field));
    }
  }

  for (const key of listKeys) {
    const items: Record<string, unknown>[] = data[key];
    const required: string[] = cvRequiredFields[key];
    const counted: string[] = countedListFields[key];

    // Having at least one entry is part of a complete CV.
    count(items.length > 0 ? true : null, false);

    for (const item of items) {
      for (const field of counted) {
        // A current job or study has no end date.
        if (field === "endDate" && item.current) continue;
        count(item[field], required.includes(field));
      }
    }
  }

  return {
    percent: total ? Math.round((filled / total) * 100) : 0,
    requiredComplete,
  };
};
