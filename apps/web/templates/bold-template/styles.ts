import styled from "@emotion/styled";
import {
  mutedColor,
  templateBlocksCss,
  pageHeightPercent,
  templateTypographyCss,
} from "@/templates/shared/styles";
import type {
  TSBoldTemplateProps,
  TSBoldTemplateRootProps,
  TSBoldTemplateRowProps,
} from "@/templates/bold-template/types";

export const SBoldTemplate = styled.div<TSBoldTemplateRootProps>`
  ${({ cvColors, typography }) => `
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background-color: ${cvColors.background};
    color: ${cvColors.text};
    ${templateTypographyCss(typography)}
    ${templateBlocksCss({ accent: cvColors.text, muted: mutedColor(cvColors.text) })}
  `}
`;

export const SBoldTemplateHero = styled.header<TSBoldTemplateRowProps>`
  ${({ cvColors, basis }) => `
    position: relative;
    flex: 0 0 ${pageHeightPercent(basis)};
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 0 8cqw 10cqw;
    background-color: ${cvColors.hero};
    color: ${cvColors.heroText};
    transition: flex-basis 150ms ease-out;
  `}
`;

export const SBoldTemplateName = styled.h1`
  margin: 0;
  max-width: 70%;
  font-size: 4.2em;
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  word-break: break-word;
`;

// Hangs off the bottom edge of the hero, whatever its height.
export const SBoldTemplatePhoto = styled.div<TSBoldTemplateProps>`
  ${({ cvColors }) => `
    position: absolute;
    right: 8cqw;
    bottom: -11cqw;
    width: 22cqw;
    height: 22cqw;
    border-radius: 50%;
    border: 1.2cqw solid ${cvColors.background};
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 7cqw;
    font-weight: 900;
    background-color: ${cvColors.text};
    color: ${cvColors.hero};
  `}
`;

export const SBoldTemplateBody = styled.main<TSBoldTemplateRowProps>`
  ${() => `
    flex: 1 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-content: start;
    gap: 6cqw;
    padding: 16cqw 8cqw 8cqw;
    overflow: hidden;
    transition: flex-basis 150ms ease-out;
  `}
`;

export const SBoldTemplateSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.5cqw;
  min-width: 0;
`;

export const SBoldTemplateWideSection = styled(SBoldTemplateSection)`
  grid-column: 1 / -1;
`;

export const SBoldTemplateHeading = styled.h2<TSBoldTemplateProps>`
  ${({ cvColors }) => `
    margin: 0;
    font-size: 1.5em;
    font-weight: 900;
    text-transform: uppercase;
    line-height: 1;

    &::after {
      content: "";
      display: block;
      width: 100%;
      height: 1cqw;
      margin-top: 1.2cqw;
      background-color: ${cvColors.hero};
    }
  `}
`;

export const SBoldTemplateParagraph = styled.p`
  margin: 0;
  font-size: 1.1em;
  white-space: pre-wrap;
  word-break: break-word;
`;

export const SBoldTemplateList = styled.dl`
  margin: 0;
  display: flex;
  flex-direction: column;

  dt {
    font-weight: 900;
    font-size: 0.8em;
    text-transform: uppercase;
  }

  dd {
    margin: 0 0 1.5cqw;
    word-break: break-word;
  }
`;
