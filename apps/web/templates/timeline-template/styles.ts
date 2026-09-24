import styled from "@emotion/styled";
import {
  mutedColor,
  templateBlocksCss,
  pageHeightPercent,
  templateTypographyCss,
} from "@/templates/shared/styles";
import type {
  TSTimelineTemplateProps,
  TSTimelineTemplateRootProps,
  TSTimelineTemplateRowProps,
} from "@/templates/timeline-template/types";

export const STimelineTemplate = styled.div<TSTimelineTemplateRootProps>`
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

export const STimelineTemplateHeader = styled.header<TSTimelineTemplateRowProps>`
  ${({ cvColors, basis }) => `
    flex: 0 0 ${pageHeightPercent(basis)};
    display: flex;
    align-items: center;
    gap: 5cqw;
    padding: 0 8cqw;
    background-color: ${cvColors.header};
    color: ${cvColors.headerText};
    overflow: hidden;
    transition: flex-basis 150ms ease-out;
  `}
`;

export const STimelineTemplatePhoto = styled.div<TSTimelineTemplateProps>`
  ${({ cvColors }) => `
    width: 17cqw;
    height: 17cqw;
    flex-shrink: 0;
    border-radius: 50%;
    border: 0.6cqw solid ${cvColors.headerText};
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 5.5cqw;
    font-weight: 700;
    background-color: ${cvColors.accent};
    color: ${cvColors.headerText};
  `}
`;

export const STimelineTemplateName = styled.h1`
  margin: 0;
  font-size: 2.7em;
  font-weight: 800;
  line-height: 1.1;
  word-break: break-word;
`;

export const STimelineTemplateBody = styled.main<TSTimelineTemplateRowProps>`
  ${() => `
    flex: 1 0 auto;
    padding: 8cqw 8cqw 8cqw 10cqw;
    overflow: hidden;
    transition: flex-basis 150ms ease-out;
  `}
`;

export const STimelineTemplateTrack = styled.ol<TSTimelineTemplateProps>`
  ${({ cvColors }) => `
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 6cqw;
    margin: 0;
    padding: 0 0 0 6cqw;
    list-style: none;

    &::before {
      content: "";
      position: absolute;
      top: 1cqw;
      bottom: 0;
      left: 1cqw;
      width: 0.4cqw;
      background-color: ${cvColors.line};
    }
  `}
`;

export const STimelineTemplateItem = styled.li<TSTimelineTemplateProps>`
  ${({ cvColors }) => `
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1.5cqw;
    min-width: 0;

    &::before {
      content: "";
      position: absolute;
      top: 0.6cqw;
      left: -6.2cqw;
      width: 2.8cqw;
      height: 2.8cqw;
      border-radius: 50%;
      border: 0.6cqw solid ${cvColors.background};
      background-color: ${cvColors.accent};
      box-shadow: 0 0 0 0.3cqw ${cvColors.accent};
    }
  `}
`;

export const STimelineTemplateHeading = styled.h2<TSTimelineTemplateProps>`
  ${({ cvColors }) => `
    margin: 0;
    font-size: 1.15em;
    font-weight: 700;
    color: ${cvColors.accent};
  `}
`;

export const STimelineTemplateParagraph = styled.p`
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

export const STimelineTemplateList = styled.dl`
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 3cqw;
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
