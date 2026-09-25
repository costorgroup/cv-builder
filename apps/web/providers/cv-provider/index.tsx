"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { findCvFont } from "@/fonts";
import {
  CvContext,
  CvPlaceholdersContext,
} from "@/providers/cv-provider/context";
import { getCvCompletion } from "@/providers/cv-provider/completion";
import { emptyCvData, withCvDefaults } from "@/providers/cv-provider/items";
import { templates } from "@/templates";
import type {
  TTemplate,
  TTemplateSizes,
  TTemplateTypography,
} from "@/templates/types";
import { getDefaultSizes, resizeSection } from "@/templates/utils";
import type {
  TCvContextValue,
  TCvData,
  TCvProviderProps,
} from "@/providers/cv-provider/types";

const findTemplate = (id?: string): TTemplate =>
  templates.find((template) => template.id === id) ??
  (templates[0] as TTemplate);

export const CvProvider = ({
  children,
  initialData = emptyCvData,
  initialAppearance,
  initialFileName = "",
}: TCvProviderProps) => {
  const form = useForm<TCvData>({
    defaultValues: withCvDefaults(initialData),
    mode: "onTouched",
  });
  // Whole-form watch: the preview and the completion follow every keystroke.
  const data = useWatch({ control: form.control }) as TCvData;
  const [template, setTemplate] = useState<TTemplate>(() =>
    findTemplate(initialAppearance?.templateId),
  );
  const [colorSchemeId, setColorSchemeId] = useState<string>(
    initialAppearance?.colorSchemeId ?? template.colorSchemes[0].id,
  );
  const [sizes, setSizes] = useState<TTemplateSizes>(
    () => initialAppearance?.sizes ?? getDefaultSizes(template),
  );
  const [fontId, setFontId] = useState<string>(
    () => initialAppearance?.fontId ?? findCvFont(template.defaultFontId).id,
  );
  const [fontScale, setFontScale] = useState<number>(
    initialAppearance?.fontScale ?? 1,
  );
  const [fileName, setFileName] = useState(initialFileName);
  const { firstName, lastName } = data.personalInformation;
  const resolvedFileName =
    fileName.trim() ||
    [firstName, lastName, "CV"].filter((part) => part?.trim()).join(" ");

  const { setValue } = form;
  const updateCvData = useCallback<TCvContextValue["updateCvData"]>(
    (key, patch) => {
      for (const [field, value] of Object.entries(patch)) {
        setValue(`${key}.${field}` as never, value as never, {
          shouldDirty: true,
        });
      }
    },
    [setValue],
  );

  const completion = useMemo(() => getCvCompletion(data), [data]);

  const setTemplateId = useCallback((id: string) => {
    const next = findTemplate(id);
    setTemplate(next);
    setColorSchemeId(next.colorSchemes[0].id);
    setSizes(getDefaultSizes(next));
    setFontId(findCvFont(next.defaultFontId).id);
    setFontScale(1);
  }, []);

  const setSectionSize = useCallback(
    (groupId: string, sectionId: string, value: number) => {
      const group = template.groups.find(({ id }) => id === groupId);
      if (!group) return;
      setSizes((current) => ({
        ...current,
        [groupId]: resizeSection(
          group,
          current[groupId] ?? {},
          sectionId,
          value,
        ),
      }));
    },
    [template],
  );

  const colors = useMemo(
    () =>
      (
        template.colorSchemes.find(({ id }) => id === colorSchemeId) ??
        template.colorSchemes[0]
      ).colors,
    [template, colorSchemeId],
  );

  const typography = useMemo<TTemplateTypography>(
    () => ({ fontFamily: findCvFont(fontId).family, fontScale }),
    [fontId, fontScale],
  );

  const value = useMemo<TCvContextValue>(
    () => ({
      data,
      updateCvData,
      completion,
      template,
      setTemplateId,
      colorSchemeId,
      setColorSchemeId,
      colors,
      sizes,
      setSectionSize,
      fontId,
      setFontId,
      fontScale,
      setFontScale,
      typography,
      fileName,
      setFileName,
      resolvedFileName,
    }),
    [
      data,
      updateCvData,
      completion,
      template,
      setTemplateId,
      colorSchemeId,
      colors,
      sizes,
      setSectionSize,
      fontId,
      fontScale,
      typography,
      fileName,
      resolvedFileName,
    ],
  );

  return (
    <FormProvider {...form}>
      <CvContext.Provider value={value}>{children}</CvContext.Provider>
    </FormProvider>
  );
};

/** Shows sample data for empty fields in the CVs rendered inside it. */
export const CvPlaceholders = ({
  enabled = true,
  children,
}: {
  enabled?: boolean;
  children: ReactNode;
}) => (
  <CvPlaceholdersContext.Provider value={enabled}>
    {children}
  </CvPlaceholdersContext.Provider>
);

export { useCv, useCvData } from "@/providers/cv-provider/context";
export { cvPlaceholderData } from "@/providers/cv-provider/placeholders";
export {
  cvRequiredFields,
  getCvCompletion,
} from "@/providers/cv-provider/completion";
export {
  CV_LEVEL_MAX,
  createCvItem,
  emptyCvData,
  languageLevelLabel,
  withCvDefaults,
  skillLevelLabel,
} from "@/providers/cv-provider/items";
export type * from "@/providers/cv-provider/types";
