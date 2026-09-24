import styled from "@emotion/styled";
import {
  mutedColor,
  templateBlocksCss,
  pageHeightPercent,
  templateTypographyCss,
} from "@/templates/shared/styles";
import type {
  TSClassicTemplateProps,
  TSClassicTemplateRootProps,
  TSClassicTemplateRowProps,
} from "@/templates/classic-template/types";

export const SClassicTemplate = styled.div<TSClassicTemplateRootProps>`
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

export const SClassicTemplateHeader = styled.header<TSClassicTemplateRowProps>`
  ${({ cvColors, basis }) => `
    flex: 0 0 ${pageHeightPercent(basis)};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2cqw;
    padding: 0 10cqw;
    text-align: center;
    border-bottom: 0.6cqw double ${cvColors.accent};
    overflow: hidden;
    transition: flex-basis 150ms ease-out;
  `}
`;

export const SClassicTemplateName = styled.h1`
  margin: 0;
  font-size: 2.8em;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0.04em;
  word-break: break-word;
`;

export const SClassicTemplateContact = styled.p<TSClassicTemplateProps>`
  ${({ cvColors }) => `
    margin: 0;
    font-size: 0.9em;
    word-break: break-word;

    span + span::before {
      content: "\\00B7";
      margin: 0 1.5cqw;
      color: ${cvColors.accent};
    }
  `}
`;

export const SClassicTemplateBody = styled.main<TSClassicTemplateRowProps>`
  ${() => `
    flex: 1 0 auto;
    display: flex;
    flex-direction: column;
    gap: 5cqw;
    padding: 6cqw 10cqw;
    overflow: hidden;
    transition: flex-basis 150ms ease-out;
  `}
`;

export const SClassicTemplateSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.5cqw;
`;

export const SClassicTemplateHeading = styled.h2<TSClassicTemplateProps>`
  ${({ cvColors }) => `
    margin: 0;
    padding-bottom: 0.6cqw;
    font-size: 1.15em;
    font-weight: 700;
    font-variant: small-caps;
    letter-spacing: 0.08em;
    color: ${cvColors.accent};
    border-bottom: 0.15cqw solid currentColor;
  `}
`;

export const SClassicTemplateParagraph = styled.p`
  margin: 0;
  text-align: justify;
  white-space: pre-wrap;
  word-break: break-word;
`;

export const SClassicTemplateList = styled.dl`
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 3cqw;
  row-gap: 0.8cqw;
  margin: 0;

  dt {
    font-style: italic;
  }

  dd {
    margin: 0;
    word-break: break-word;
  }
`;
