import styled from "@emotion/styled";
import {
  mutedColor,
  templateBlocksCss,
  templateTypographyCss,
} from "@/templates/shared/styles";
import type {
  TSColumnsTemplateColumnProps,
  TSColumnsTemplateProps,
  TSColumnsTemplateRootProps,
} from "@/templates/columns-template/types";

export const SColumnsTemplate = styled.div<TSColumnsTemplateRootProps>`
  ${({ cvColors, typography }) => `
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background-color: ${cvColors.background};
    color: ${cvColors.text};
    ${templateTypographyCss(typography)}
    ${templateBlocksCss({ accent: cvColors.accent, muted: mutedColor(cvColors.text) })}
  `}
`;

export const SColumnsTemplateHeader = styled.header<TSColumnsTemplateProps>`
  ${({ cvColors }) => `
    display: flex;
    align-items: center;
    gap: 4cqw;
    padding: 7cqw 6cqw;
    background-color: ${cvColors.header};
    color: ${cvColors.headerText};
  `}
`;

export const SColumnsTemplatePhoto = styled.div<TSColumnsTemplateProps>`
  ${({ cvColors }) => `
    width: 15cqw;
    height: 15cqw;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 5cqw;
    font-weight: 700;
    background-color: ${cvColors.accent};
    color: ${cvColors.header};
  `}
`;

export const SColumnsTemplateName = styled.h1`
  margin: 0;
  font-size: 2.6em;
  font-weight: 700;
  line-height: 1.1;
  word-break: break-word;
`;

export const SColumnsTemplateColumns = styled.div`
  flex: 1 0 auto;
  display: flex;
  min-height: 0;
`;

export const SColumnsTemplateColumn = styled.div<TSColumnsTemplateColumnProps>`
  ${({ cvColors, basis }) => `
    flex: 0 0 ${basis}%;
    display: flex;
    flex-direction: column;
    gap: 5cqw;
    padding: 6cqw 4cqw;
    overflow: hidden;
    transition: flex-basis 150ms ease-out;

    & + & {
      border-left: 0.2cqw solid ${cvColors.accent};
    }
  `}
`;

export const SColumnsTemplateSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 2cqw;
  min-width: 0;
`;

export const SColumnsTemplateHeading = styled.h2<TSColumnsTemplateProps>`
  ${({ cvColors }) => `
    margin: 0;
    font-size: 0.95em;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: ${cvColors.accent};
  `}
`;

export const SColumnsTemplateParagraph = styled.p`
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

export const SColumnsTemplateList = styled.dl`
  margin: 0;
  display: flex;
  flex-direction: column;

  dt {
    font-size: 0.8em;
    font-weight: 700;
  }

  dd {
    margin: 0 0 1.5cqw;
    word-break: break-word;
  }
`;
