import styled from "@emotion/styled";
import {
  templateBlocksCss,
  templateTypographyCss,
} from "@/templates/shared/styles";
import type {
  TSMinimalTemplateProps,
  TSMinimalTemplateRootProps,
  TSMinimalTemplateRowsProps,
} from "@/templates/minimal-template/types";

/** Page padding, in `cqw`. */
const PADDING = 9;

export const SMinimalTemplate = styled.div<TSMinimalTemplateRootProps>`
  ${({ cvColors, typography }) => `
    display: flex;
    flex-direction: column;
    gap: 7cqw;
    width: 100%;
    height: 100%;
    padding: ${PADDING}cqw;
    background-color: ${cvColors.background};
    color: ${cvColors.text};
    overflow: hidden;
    ${templateTypographyCss(typography)}
    ${templateBlocksCss({ accent: cvColors.accent, muted: cvColors.muted })}
  `}
`;

export const SMinimalTemplateName = styled.h1<TSMinimalTemplateProps>`
  ${({ cvColors }) => `
    margin: 0;
    font-size: 2.6em;
    font-weight: 300;
    line-height: 1.1;
    letter-spacing: -0.01em;
    word-break: break-word;

    strong {
      font-weight: 700;
      color: ${cvColors.accent};
    }
  `}
`;

// The label column is sized in page units so its edge sits exactly at
// `labelsEnd`% of the page, under the resize slider.
export const SMinimalTemplateRows = styled.div<TSMinimalTemplateRowsProps>`
  ${({ labelsEnd }) => `
    display: grid;
    grid-template-columns: calc(${labelsEnd}cqw - ${PADDING}cqw) 1fr;
    row-gap: 5cqw;
    transition: grid-template-columns 150ms ease-out;
  `}
`;

export const SMinimalTemplateLabel = styled.h2<TSMinimalTemplateProps>`
  ${({ cvColors }) => `
    margin: 0;
    padding-right: 3cqw;
    font-size: 0.8em;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: ${cvColors.muted};
  `}
`;

export const SMinimalTemplateContent = styled.div<TSMinimalTemplateProps>`
  ${({ cvColors }) => `
    min-width: 0;
    padding-left: 3cqw;
    border-left: 0.2cqw solid ${cvColors.accent};
  `}
`;

export const SMinimalTemplateParagraph = styled.p`
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

export const SMinimalTemplateList = styled.dl<TSMinimalTemplateProps>`
  ${({ cvColors }) => `
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: 3cqw;
    row-gap: 0.8cqw;
    margin: 0;

    dt {
      color: ${cvColors.muted};
    }

    dd {
      margin: 0;
      word-break: break-word;
    }
  `}
`;
