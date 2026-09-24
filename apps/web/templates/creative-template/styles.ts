import styled from "@emotion/styled";
import {
  mutedColor,
  templateBlocksCss,
  templateTypographyCss,
} from "@/templates/shared/styles";
import type {
  TSCreativeTemplateColumnProps,
  TSCreativeTemplateProps,
  TSCreativeTemplateRootProps,
} from "@/templates/creative-template/types";

export const SCreativeTemplate = styled.div<TSCreativeTemplateRootProps>`
  ${({ cvColors, typography }) => `
    display: flex;
    width: 100%;
    height: 100%;
    background-color: ${cvColors.background};
    color: ${cvColors.text};
    ${templateTypographyCss(typography)}
    ${templateBlocksCss({ accent: cvColors.strip, muted: mutedColor(cvColors.text) })}
  `}
`;

export const SCreativeTemplateStrip = styled.aside<TSCreativeTemplateColumnProps>`
  ${({ cvColors, basis }) => `
    position: relative;
    flex: 0 0 ${basis}%;
    display: flex;
    flex-direction: column;
    gap: 4cqw;
    /* Content starts below the absolutely positioned photo. */
    padding: 38cqw 5cqw 8cqw;
    background-color: ${cvColors.strip};
    color: ${cvColors.stripText};
    overflow: hidden;
    transition: flex-basis 150ms ease-out;

    &::before {
      content: "";
      position: absolute;
      top: -12cqw;
      right: -12cqw;
      width: 36cqw;
      height: 36cqw;
      border-radius: 50%;
      background-color: ${cvColors.accent};
      opacity: 0.35;
    }
  `}
`;

export const SCreativeTemplatePhoto = styled.div<TSCreativeTemplateProps>`
  ${({ cvColors }) => `
    position: absolute;
    top: 8cqw;
    left: 5cqw;
    /* Shrinks with a narrow strip (keeping room for its shadow); stays square. */
    width: 22cqw;
    max-width: calc(100% - 12cqw);
    aspect-ratio: 1;
    border-radius: 3cqw;
    transform: rotate(-4deg);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 7cqw;
    font-weight: 700;
    background-color: ${cvColors.accent};
    color: ${cvColors.strip};
    box-shadow: 1.5cqw 1.5cqw 0 ${cvColors.stripText};
  `}
`;

export const SCreativeTemplateName = styled.h1<TSCreativeTemplateProps>`
  ${({ cvColors }) => `
    position: relative;
    margin: 0;
    font-size: 3.4em;
    font-weight: 800;
    line-height: 0.95;
    word-break: break-word;

    span {
      display: block;
      font-style: italic;
      color: ${cvColors.accent};
    }
  `}
`;

export const SCreativeTemplateMain = styled.main<TSCreativeTemplateColumnProps>`
  ${({ basis }) => `
    flex: 0 0 ${basis}%;
    display: flex;
    flex-direction: column;
    gap: 6cqw;
    padding: 10cqw 7cqw;
    overflow: hidden;
    transition: flex-basis 150ms ease-out;
  `}
`;

export const SCreativeTemplateQuote = styled.blockquote<TSCreativeTemplateProps>`
  ${({ cvColors }) => `
    position: relative;
    margin: 0;
    padding-top: 6cqw;
    font-size: 1.2em;
    font-style: italic;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;

    &::before {
      content: "\\201C";
      position: absolute;
      top: -3cqw;
      left: -1cqw;
      font-size: 5em;
      line-height: 1;
      color: ${cvColors.accent};
    }
  `}
`;

export const SCreativeTemplateSection = styled.section`
  /* Above the strip's decorative circle. */
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2cqw;
`;

export const SCreativeTemplateHeading = styled.h2<TSCreativeTemplateProps>`
  ${({ cvColors }) => `
    margin: 0;
    font-size: 1.4em;
    font-weight: 800;
    color: ${cvColors.strip};
  `}
`;

export const SCreativeTemplateStripHeading = styled.h2<TSCreativeTemplateProps>`
  ${({ cvColors }) => `
    margin: 0;
    font-size: 1.1em;
    font-weight: 800;
    font-style: italic;
    color: ${cvColors.accent};
  `}
`;

export const SCreativeTemplateStripList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.8cqw;
  font-size: 0.9em;

  li {
    word-break: break-word;
  }
`;

export const SCreativeTemplateChips = styled.ul<TSCreativeTemplateProps>`
  ${({ cvColors }) => `
    display: flex;
    flex-wrap: wrap;
    gap: 1.5cqw;
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      padding: 0.8cqw 2cqw;
      border-radius: 5cqw;
      border: 0.25cqw solid ${cvColors.strip};
      font-size: 0.9em;
      word-break: break-word;
    }

    strong {
      color: ${cvColors.strip};
      margin-right: 1cqw;
    }
  `}
`;
