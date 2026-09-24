import styled from "@emotion/styled";
import {
  mutedColor,
  templateBlocksCss,
  pageHeightPercent,
  templateTypographyCss,
} from "@/templates/shared/styles";
import type {
  TSExecutiveTemplateProps,
  TSExecutiveTemplateRootProps,
  TSExecutiveTemplateSectionProps,
} from "@/templates/executive-template/types";

export const SExecutiveTemplate = styled.div<TSExecutiveTemplateRootProps>`
  ${({ cvColors, typography }) => `
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background-color: ${cvColors.background};
    color: ${cvColors.text};
    ${templateTypographyCss(typography)}
    ${templateBlocksCss({ accent: cvColors.header, muted: mutedColor(cvColors.text) })}
  `}
`;

export const SExecutiveTemplateHeader = styled.header<TSExecutiveTemplateSectionProps>`
  ${({ cvColors, basis }) => `
    flex: 0 0 ${pageHeightPercent(basis)};
    display: flex;
    align-items: center;
    gap: 5cqw;
    padding: 0 7cqw;
    background-color: ${cvColors.header};
    color: ${cvColors.headerText};
    overflow: hidden;
    transition: flex-basis 150ms ease-out;
  `}
`;

export const SExecutiveTemplatePhoto = styled.div<TSExecutiveTemplateProps>`
  ${({ cvColors }) => `
    width: 20cqw;
    height: 20cqw;
    flex-shrink: 0;
    border-radius: 50%;
    border: 0.8cqw solid ${cvColors.accent};
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 6cqw;
    font-weight: 700;
    background-color: ${cvColors.headerText};
    color: ${cvColors.header};
  `}
`;

export const SExecutiveTemplateName = styled.h1`
  margin: 0;
  font-size: 2.8em;
  font-weight: 700;
  line-height: 1.1;
  word-break: break-word;
`;

export const SExecutiveTemplateColumns = styled.div`
  flex: 1 0 auto;
  display: flex;
  min-height: 0;
`;

export const SExecutiveTemplateAside = styled.aside<TSExecutiveTemplateSectionProps>`
  ${({ cvColors, basis }) => `
    flex: 0 0 ${basis}%;
    display: flex;
    flex-direction: column;
    gap: 5cqw;
    padding: 6cqw 5cqw;
    background-color: ${cvColors.aside};
    overflow: hidden;
    transition: flex-basis 150ms ease-out;
  `}
`;

export const SExecutiveTemplateMain = styled.main<TSExecutiveTemplateSectionProps>`
  ${({ basis }) => `
    flex: 0 0 ${basis}%;
    display: flex;
    flex-direction: column;
    gap: 5cqw;
    padding: 6cqw;
    overflow: hidden;
    transition: flex-basis 150ms ease-out;
  `}
`;

export const SExecutiveTemplateSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.5cqw;
`;

export const SExecutiveTemplateHeading = styled.h2<TSExecutiveTemplateProps>`
  ${({ cvColors }) => `
    margin: 0;
    padding-left: 2cqw;
    font-size: 1.05em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border-left: 1cqw solid ${cvColors.accent};
  `}
`;

export const SExecutiveTemplateParagraph = styled.p`
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

export const SExecutiveTemplateList = styled.dl`
  margin: 0;
  display: flex;
  flex-direction: column;

  dt {
    font-weight: 700;
    font-size: 0.85em;
  }

  dd {
    margin: 0 0 1.5cqw;
    word-break: break-word;
  }
`;
