"use client";

import { useId } from "react";
import { Color, Flex, FormControl, GridCell, Range } from "@costor/ui";
import { cvFonts } from "@/fonts";
import { useCv } from "@/providers/cv-provider/context";
import {
  SAppearancePageFont,
  SAppearancePageGrid,
  SAppearancePageOptions,
} from "@/views/appearance-page/styles";
import type { TAppearancePageProps } from "@/views/appearance-page/types";

const AppearancePage = ({ ...props }: TAppearancePageProps) => {
  const {
    template,
    colorSchemeId,
    setColorSchemeId,
    fontId,
    setFontId,
    fontScale,
    setFontScale,
  } = useCv();
  // FormControl labels itself with `${id}-label`; the groups reuse that.
  const accentColorGroupId = useId();
  const fontGroupId = useId();

  return (
    <Flex direction="column" gap={5} {...props}>
      <FormControl id={accentColorGroupId} label="Accent Color" size="sm">
        <SAppearancePageOptions
          role="group"
          aria-labelledby={`${accentColorGroupId}-label`}
          direction="row"
          gap={2}
          wrap="wrap"
        >
          {template.colorSchemes.map((scheme) => (
            <Color
              key={scheme.id}
              title={scheme.name}
              aria-label={scheme.name}
              colors={Object.values(scheme.colors)}
              selected={scheme.id === colorSchemeId}
              onClick={() => setColorSchemeId(scheme.id)}
            />
          ))}
        </SAppearancePageOptions>
      </FormControl>
      <FormControl id={fontGroupId} label="Font" size="sm">
        <SAppearancePageGrid
          role="group"
          aria-labelledby={`${fontGroupId}-label`}
          columns={2}
          gap={2}
        >
          {cvFonts.map((font) => (
            <GridCell key={font.id}>
              <SAppearancePageFont
                type="button"
                fontFamily={font.family}
                selected={font.id === fontId}
                aria-pressed={font.id === fontId}
                onClick={() => setFontId(font.id)}
              >
                <strong>Aa</strong>
                <span>{font.name}</span>
              </SAppearancePageFont>
            </GridCell>
          ))}
        </SAppearancePageGrid>
      </FormControl>
      <Range
        label="Text Size"
        size="sm"
        color="primary"
        min={80}
        max={120}
        step={5}
        value={Math.round(fontScale * 100)}
        renderValue={({ value }) => `${value}%`}
        onChange={(_, next) =>
          typeof next === "number" && setFontScale(next / 100)
        }
      />
    </Flex>
  );
};

export default AppearancePage;
