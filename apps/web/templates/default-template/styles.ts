import styled from "@emotion/styled";
import {
  mutedColor,
  templateBlocksCss,
  templateTypographyCss,
} from "@/templates/shared/styles";
import type {
  TSDefaultTemplateColumnProps,
  TSDefaultTemplateProps,
  TSDefaultTemplateRootProps,
} from "@/templates/default-template/types";

// Sizes use `cqw` (percent of the page width) so the CV scales with the page.
// Text sizes are `em` of the root, so `fontScale` resizes all text at once.
export const SDefaultTemplate = styled.div<TSDefaultTemplateRootProps>`
  ${({ cvColors, typography }) => `
    display: flex;
    width: 100%;
    height: 100%;
    background-color: ${cvColors.background};
    color: ${cvColors.text};
    ${templateTypographyCss(typography)}
    ${templateBlocksCss({ accent: cvColors.sidebar, muted: mutedColor(cvColors.text) })}
  `}
`;

export const SDefaultTemplateSidebar = styled.aside<TSDefaultTemplateColumnProps>`
  ${({ cvColors, basis }) => `
    flex: 0 0 ${basis}%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3cqw;
    padding: 5cqw 4cqw;
    background-color: ${cvColors.sidebar};
    color: ${cvColors.sidebarText};
    overflow: hidden;
    transition: flex-basis 150ms ease-out;
  `}
`;

export const SDefaultTemplateMain = styled.main<TSDefaultTemplateColumnProps>`
  ${({ basis }) => `
    flex: 0 0 ${basis}%;
    display: flex;
    flex-direction: column;
    gap: 4cqw;
    padding: 5cqw;
    overflow: hidden;
    transition: flex-basis 150ms ease-out;
  `}
`;

export const SDefaultTemplatePhoto = styled.div<TSDefaultTemplateProps>`
  ${({ cvColors }) => `
    /* Shrinks with a narrow sidebar instead of being cut off; stays round. */
    width: 18cqw;
    max-width: 100%;
    aspect-ratio: 1;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 6cqw;
    font-weight: 600;
    background-color: ${cvColors.accent};
    color: ${cvColors.sidebar};

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `}
`;

export const SDefaultTemplateName = styled.h1`
  margin: 0;
  font-size: 2.4em;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
  word-break: break-word;
`;

export const SDefaultTemplateSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.2cqw;
  width: 100%;
`;

export const SDefaultTemplateHeading = styled.h2<TSDefaultTemplateProps>`
  ${({ cvColors }) => `
    margin: 0;
    padding-bottom: 0.8cqw;
    font-size: 1.25em;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    border-bottom: 0.25cqw solid ${cvColors.accent};
  `}
`;

export const SDefaultTemplateParagraph = styled.p`
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

export const SDefaultTemplateList = styled.dl`
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 2cqw;
  row-gap: 0.8cqw;
  margin: 0;

  dt {
    font-weight: 600;
  }

  dd {
    margin: 0;
    word-break: break-word;
  }
`;
