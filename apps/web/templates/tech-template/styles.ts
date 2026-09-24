import styled from "@emotion/styled";
import {
  templateBlocksCss,
  templateTypographyCss,
} from "@/templates/shared/styles";
import type {
  TSTechTemplateColumnProps,
  TSTechTemplateProps,
  TSTechTemplateRootProps,
} from "@/templates/tech-template/types";

const MONO = `ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`;

export const STechTemplate = styled.div<TSTechTemplateRootProps>`
  ${({ cvColors, typography }) => `
    display: flex;
    width: 100%;
    height: 100%;
    background-color: ${cvColors.background};
    color: ${cvColors.text};
    ${templateTypographyCss(typography)}
    ${templateBlocksCss({ accent: cvColors.accent, muted: cvColors.muted })}
  `}
`;

export const STechTemplateSidebar = styled.aside<TSTechTemplateColumnProps>`
  ${({ cvColors, basis }) => `
    flex: 0 0 ${basis}%;
    display: flex;
    flex-direction: column;
    gap: 5cqw;
    padding: 8cqw 5cqw;
    background-color: ${cvColors.sidebar};
    border-right: 0.3cqw solid ${cvColors.accent};
    overflow: hidden;
    transition: flex-basis 150ms ease-out;
  `}
`;

export const STechTemplatePhoto = styled.div<TSTechTemplateProps>`
  ${({ cvColors }) => `
    /* Shrinks with a narrow sidebar instead of being cut off; stays square. */
    width: 20cqw;
    max-width: 100%;
    aspect-ratio: 1;
    flex-shrink: 0;
    border-radius: 1cqw;
    border: 0.4cqw solid ${cvColors.accent};
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ${MONO};
    font-size: 6cqw;
    font-weight: 700;
    color: ${cvColors.accent};
  `}
`;

export const STechTemplateMain = styled.main<TSTechTemplateColumnProps>`
  ${({ basis }) => `
    flex: 0 0 ${basis}%;
    display: flex;
    flex-direction: column;
    gap: 6cqw;
    padding: 8cqw 6cqw;
    overflow: hidden;
    transition: flex-basis 150ms ease-out;
  `}
`;

export const STechTemplateName = styled.h1<TSTechTemplateProps>`
  ${({ cvColors }) => `
    margin: 0;
    font-size: 2.8em;
    font-weight: 700;
    line-height: 1.1;
    word-break: break-word;

    &::after {
      content: "_";
      color: ${cvColors.accent};
    }
  `}
`;

export const STechTemplateSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.5cqw;
  min-width: 0;
`;

export const STechTemplateHeading = styled.h2<TSTechTemplateProps>`
  ${({ cvColors }) => `
    margin: 0;
    font-family: ${MONO};
    font-size: 0.95em;
    font-weight: 600;
    color: ${cvColors.accent};

    &::before {
      content: "// ";
      color: ${cvColors.muted};
    }
  `}
`;

export const STechTemplateParagraph = styled.p`
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

export const STechTemplateList = styled.dl<TSTechTemplateProps>`
  ${({ cvColors }) => `
    margin: 0;
    display: flex;
    flex-direction: column;
    font-family: ${MONO};
    font-size: 0.85em;

    dt {
      color: ${cvColors.muted};
    }

    dt::after {
      content: ":";
    }

    dd {
      margin: 0 0 1.5cqw;
      overflow-wrap: anywhere;
    }
  `}
`;
