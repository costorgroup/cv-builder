import styled from "@emotion/styled";
import {
  mutedColor,
  templateBlocksCss,
  pageHeightPercent,
  templateTypographyCss,
} from "@/templates/shared/styles";
import type {
  TSElegantTemplateProps,
  TSElegantTemplateRootProps,
  TSElegantTemplateRowProps,
} from "@/templates/elegant-template/types";

export const SElegantTemplate = styled.div<TSElegantTemplateRootProps>`
  ${({ cvColors, typography }) => `
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background-color: ${cvColors.background};
    color: ${cvColors.text};
    text-align: center;
    ${templateTypographyCss(typography)}
    ${templateBlocksCss({ accent: cvColors.accent, muted: mutedColor(cvColors.text) })}

    .cv-entry-head {
      flex-direction: column;
      align-items: center;
    }

    .cv-entry-title {
      font-weight: 600;
    }
  `}
`;

export const SElegantTemplateHeader = styled.header<TSElegantTemplateRowProps>`
  ${({ basis }) => `
    flex: 0 0 ${pageHeightPercent(basis)};
    display: flex;
    padding: 6cqw 8cqw 0;
    overflow: hidden;
    transition: flex-basis 150ms ease-out;
  `}
`;

export const SElegantTemplateFrame = styled.div<TSElegantTemplateProps>`
  ${({ cvColors }) => `
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2cqw;
    border: 0.8cqw double ${cvColors.frame};
    padding: 3cqw;
  `}
`;

export const SElegantTemplateName = styled.h1`
  margin: 0;
  font-size: 2.6em;
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  word-break: break-word;
`;

export const SElegantTemplateOrnament = styled.div<TSElegantTemplateProps>`
  ${({ cvColors }) => `
    display: flex;
    align-items: center;
    gap: 2cqw;
    width: 40%;
    color: ${cvColors.accent};

    &::before,
    &::after {
      content: "";
      flex: 1;
      height: 0.2cqw;
      background-color: currentColor;
    }
  `}
`;

export const SElegantTemplateBody = styled.main<TSElegantTemplateRowProps>`
  ${() => `
    flex: 1 0 auto;
    display: flex;
    flex-direction: column;
    gap: 6cqw;
    padding: 7cqw 12cqw;
    overflow: hidden;
    transition: flex-basis 150ms ease-out;
  `}
`;

export const SElegantTemplateParagraph = styled.p`
  margin: 0;
  font-style: italic;
  font-size: 1.1em;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
`;

export const SElegantTemplateGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6cqw;
`;

export const SElegantTemplateSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 2cqw;
  min-width: 0;
`;

export const SElegantTemplateHeading = styled.h2<TSElegantTemplateProps>`
  ${({ cvColors }) => `
    margin: 0;
    font-size: 0.95em;
    font-weight: 500;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: ${cvColors.accent};
  `}
`;

export const SElegantTemplateList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1cqw;

  li {
    word-break: break-word;
  }
`;
