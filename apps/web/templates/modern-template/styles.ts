import styled from "@emotion/styled";
import {
  mutedColor,
  templateBlocksCss,
  templateTypographyCss,
} from "@/templates/shared/styles";
import type {
  TSModernTemplateColumnProps,
  TSModernTemplateProps,
  TSModernTemplateRootProps,
} from "@/templates/modern-template/types";

export const SModernTemplate = styled.div<TSModernTemplateRootProps>`
  ${({ cvColors, typography }) => `
    display: flex;
    width: 100%;
    height: 100%;
    background-color: ${cvColors.background};
    color: ${cvColors.text};
    ${templateTypographyCss(typography)}
    ${templateBlocksCss({ accent: cvColors.accent, muted: mutedColor(cvColors.text) })}
  `}
`;

export const SModernTemplateMain = styled.main<TSModernTemplateColumnProps>`
  ${({ basis }) => `
    flex: 0 0 ${basis}%;
    display: flex;
    flex-direction: column;
    gap: 5cqw;
    padding: 8cqw 6cqw;
    overflow: hidden;
    transition: flex-basis 150ms ease-out;
  `}
`;

export const SModernTemplateSidebar = styled.aside<TSModernTemplateColumnProps>`
  ${({ cvColors, basis }) => `
    flex: 0 0 ${basis}%;
    display: flex;
    flex-direction: column;
    gap: 4cqw;
    padding: 8cqw 5cqw;
    background-color: ${cvColors.sidebar};
    color: ${cvColors.sidebarText};
    overflow: hidden;
    transition: flex-basis 150ms ease-out;

    .cv-entry-subtitle {
      color: ${cvColors.accent};
    }

    .cv-entry-date {
      color: ${mutedColor(cvColors.sidebarText, 70)};
    }
  `}
`;

export const SModernTemplateName = styled.h1<TSModernTemplateProps>`
  ${({ cvColors }) => `
    margin: 0;
    font-size: 3.2em;
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.02em;
    word-break: break-word;

    span {
      display: block;
      color: ${cvColors.accent};
    }
  `}
`;

export const SModernTemplatePhoto = styled.div<TSModernTemplateProps>`
  ${({ cvColors }) => `
    width: 100%;
    aspect-ratio: 1;
    border-radius: 2cqw;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8cqw;
    font-weight: 700;
    background-color: ${cvColors.accent};
    color: ${cvColors.sidebar};
  `}
`;

export const SModernTemplateSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.5cqw;
`;

export const SModernTemplateHeading = styled.h2<TSModernTemplateProps>`
  ${({ cvColors }) => `
    margin: 0;
    font-size: 0.9em;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;

    &::after {
      content: "";
      display: block;
      width: 6cqw;
      height: 0.5cqw;
      margin-top: 1cqw;
      background-color: ${cvColors.accent};
    }
  `}
`;

export const SModernTemplateParagraph = styled.p`
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

export const SModernTemplateList = styled.dl`
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4cqw;

  dt {
    font-size: 0.75em;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.7;
  }

  dd {
    margin: 0 0 1.2cqw;
    word-break: break-word;
  }
`;
