import type { ReactNode } from "react";
import type { TCvAppearance, TCvData, TCvObjectKey } from "@repo/cv-core";
import type { TCvCompletion } from "@/providers/cv-provider/completion";
import type {
  TTemplate,
  TTemplateSizes,
  TTemplateTypography,
} from "@/templates/types";

export type {
  TCvAppearance,
  TCvCertificate,
  TCvData,
  TCvDocument,
  TCvEducation,
  TCvInterest,
  TCvLanguage,
  TCvListItem,
  TCvListKey,
  TCvObjectKey,
  TCvPersonalInformation,
  TCvProject,
  TCvSkill,
  TCvSocialMedia,
  TCvWorkExperience,
} from "@repo/cv-core";

export type TCvContextValue = {
  /**
   * Live form values. The data itself lives in the react-hook-form form that
   * `CvProvider` creates; fields edit it through `useFormContext<TCvData>()`.
   */
  data: TCvData;
  /** Sets fields outside a form input (e.g. the uploaded photo). */
  updateCvData: <K extends TCvObjectKey>(
    key: K,
    patch: Partial<TCvData[K]>,
  ) => void;
  completion: TCvCompletion;
  template: TTemplate;
  setTemplateId: (id: string) => void;
  colorSchemeId: string;
  setColorSchemeId: (id: string) => void;
  colors: Record<string, string>;
  sizes: TTemplateSizes;
  setSectionSize: (groupId: string, sectionId: string, value: number) => void;
  /** Puts every section back to the template's default size. */
  resetSectionSizes: () => void;
  /** Font id from `@/fonts`. */
  fontId: string;
  setFontId: (id: string) => void;
  /** Text size multiplier, 1 = the template default. */
  fontScale: number;
  setFontScale: (scale: number) => void;
  typography: TTemplateTypography;
  /** Everything above that's saved with the CV, as one object. */
  appearance: TCvAppearance;
  /**
   * The appearance the CV was opened with (defaults filled in); null for a
   * new CV. Whatever premium options it already used can be kept.
   */
  savedAppearance: TCvAppearance | null;
  /** PDF file name without `.pdf`, as typed; may be empty. */
  fileName: string;
  setFileName: (fileName: string) => void;
  /** `fileName`, or a name made from the CV owner when it's empty. */
  resolvedFileName: string;
};

export type TCvProviderProps = {
  children: ReactNode;
  initialData?: TCvData;
  initialAppearance?: Partial<TCvAppearance>;
  /**
   * How the CV looks as saved, when editing a saved one: premium options it
   * already uses stay allowed after a downgrade. Unset for a new CV.
   */
  savedAppearance?: Partial<TCvAppearance>;
  /** A saved CV's name; empty means "<first> <last> CV". */
  initialFileName?: string;
};
