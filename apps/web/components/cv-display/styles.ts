import styled from "@emotion/styled";
import { CV_STEP_ATTRIBUTE } from "@/templates/shared";
import { CV_PAGE_HEIGHT_CQW } from "@/templates/shared/styles";
import type {
  TSCvDisplayDocumentProps,
  TSCvDisplayPageProps,
  TSCvDisplayVariantProps,
} from "@/components/cv-display/types";

const variantProps = new Set(["variant", "selectable"]);

// The print variant is laid out at real A4 size (210 × 297 mm), one page per
// sheet; everything inside scales from the page width, so it matches the preview.
export const SCvDisplay = styled("div", {
  shouldForwardProp: (prop) => !variantProps.has(prop),
})<TSCvDisplayVariantProps>`
  ${({ theme, variant }) => `
    position: relative;
    display: flex;
    flex-direction: column;
    gap: ${variant === "print" ? 0 : theme.spacing(5)};
    width: ${variant === "print" ? "210mm" : "100%"};
  `}
`;

// Positioning box for a page and the resize sliders laid over it. The page
// clips its content, so the sliders live next to it rather than inside.
export const SCvDisplayPageFrame = styled("div", {
  shouldForwardProp: (prop) => !variantProps.has(prop),
})<TSCvDisplayVariantProps>`
  ${({ variant }) => `
    position: relative;
    width: 100%;
    ${variant === "print" ? "break-after: page; &:last-of-type { break-after: auto; }" : ""}
  `}
`;

/**
 * A page. When `selectable`, the innermost hovered part of the CV (anything
 * marked with its editor step) gets a tinted box with a border, over its own
 * background, to show it can be clicked.
 */
export const SCvDisplayPage = styled("div", {
  shouldForwardProp: (prop) => !variantProps.has(prop),
})<TSCvDisplayPageProps>`
  ${({ theme, variant, selectable }) => `
    background-color: ${theme.palette.common.white};
    width: 100%;
    aspect-ratio: 210 / 297;
    overflow: hidden;
    container-type: inline-size;
    box-shadow: ${variant === "print" ? "none" : theme.shadows[5]};

    ${
      selectable
        ? `
    [${CV_STEP_ATTRIBUTE}] {
      cursor: pointer;
      border-radius: 0.6cqw;
      outline: 0.2cqw solid transparent;
      outline-offset: 0.4cqw;
      transition: outline-color 0.15s ease;
    }

    [${CV_STEP_ATTRIBUTE}]:hover:not(:has([${CV_STEP_ATTRIBUTE}]:hover)) {
      outline-color: ${theme.palette.primary.main};
      background-image: linear-gradient(
        color-mix(in srgb, ${theme.palette.primary.main} 10%, transparent),
        color-mix(in srgb, ${theme.palette.primary.main} 10%, transparent)
      );
    }

    @media (prefers-reduced-motion: reduce) {
      [${CV_STEP_ATTRIBUTE}] {
        transition: none;
      }
    }
  `
        : ""
    }
  `}
`;

/**
 * The whole CV as one tall document, a whole number of pages high. Each page
 * shows it shifted up by `offset` pages. The template root stretches to fill
 * it, so sidebars and backgrounds run through every page.
 */
export const SCvDisplayDocument = styled("div", {
  shouldForwardProp: (prop) => !["pages", "offset"].includes(prop),
})<TSCvDisplayDocumentProps>`
  ${({ pages, offset }) => `
    display: flex;
    flex-direction: column;
    min-height: calc(${pages} * ${CV_PAGE_HEIGHT_CQW}cqw);
    transform: translateY(calc(${-offset} * ${CV_PAGE_HEIGHT_CQW}cqw));

    & > * {
      flex: 1 0 auto;
      height: auto !important;
    }
  `}
`;

/**
 * Invisible copy used to measure the CV and find page breaks. It lays out at
 * the page width but takes no space; transitions are off so it measures final
 * sizes, not mid-animation ones.
 */
export const SCvDisplayMeasure = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 0;
  overflow: hidden;
  visibility: hidden;
  pointer-events: none;
  container-type: inline-size;

  * {
    transition: none !important;
  }
`;
