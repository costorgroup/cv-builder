"use client";

import { findCvFont } from "@/fonts";
import { STemplatePreview } from "@/components/template-preview/styles";
import type { TTemplatePreviewProps } from "@/components/template-preview/types";
import { CvPlaceholders, CvProvider } from "@/providers/cv-provider";
import { getDefaultSizes } from "@/templates";

/** A template's first page filled with sample data, for showcasing it. */
export const TemplatePreview = ({
  template,
  colorSchemeIndex = 0,
  ...props
}: TTemplatePreviewProps) => {
  const colorScheme =
    template.colorSchemes[colorSchemeIndex] ?? template.colorSchemes[0];

  return (
    <STemplatePreview aria-hidden {...props}>
      <CvProvider initialAppearance={{ templateId: template.id }}>
        <CvPlaceholders>
          {template.render({
            colors: colorScheme.colors,
            sizes: getDefaultSizes(template),
            typography: {
              fontFamily: findCvFont(template.defaultFontId).family,
              fontScale: 1,
            },
          })}
        </CvPlaceholders>
      </CvProvider>
    </STemplatePreview>
  );
};

export default TemplatePreview;
