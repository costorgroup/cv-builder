import type { TTemplateTypography } from "@/templates/types";

/**
 * Base text styles for a template root. Text inside should be sized in `em`
 * so the Appearance text size scales all of it.
 */
export const templateTypographyCss = ({
  fontFamily,
  fontScale,
}: TTemplateTypography) => `
  font-family: ${fontFamily};
  font-size: calc(1.5cqw * ${fontScale});
  line-height: 1.5;
`;

/** A softer version of `color` for dates, labels and empty level marks. */
export const mutedColor = (color: string, amount = 55) =>
  `color-mix(in srgb, ${color} ${amount}%, transparent)`;

/**
 * Layout for the shared blocks (`TemplateEntries`, `TemplateLevels`,
 * `TemplateChips`, `TemplateInlineList`). Add it to a template root; the
 * template can override any of it further down.
 */
export const templateBlocksCss = ({
  accent,
  muted,
}: {
  /** Entry subtitles (company, institution, ...). */
  accent: string;
  /** Entry dates. */
  muted: string;
}) => `
  .cv-entries {
    display: flex;
    flex-direction: column;
    gap: 3cqw;
  }

  .cv-entry-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    column-gap: 2cqw;
  }

  .cv-entry-title {
    margin: 0;
    font-size: 1.05em;
    font-weight: 700;
    line-height: 1.3;
  }

  .cv-entry-date {
    flex-shrink: 0;
    font-size: 0.85em;
    color: ${muted};
    white-space: nowrap;
  }

  .cv-entry-subtitle {
    margin: 0.3cqw 0 0;
    font-size: 0.9em;
    font-weight: 600;
    color: ${accent};
  }

  .cv-entry-description {
    margin: 1cqw 0 0;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .cv-levels {
    display: flex;
    flex-direction: column;
    gap: 1.2cqw;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .cv-level {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2cqw;
  }

  .cv-levels-bar .cv-level {
    flex-direction: column;
    align-items: stretch;
    gap: 0.6cqw;
  }

  .cv-level-name {
    min-width: 0;
    word-break: break-word;
  }

  .cv-level-label {
    flex-shrink: 0;
    font-size: 0.85em;
  }

  .cv-stars {
    flex-shrink: 0;
    letter-spacing: 0.1em;
    line-height: 1;
  }

  .cv-dots {
    flex-shrink: 0;
    display: inline-flex;
    gap: 0.35em;

    span {
      width: 0.6em;
      height: 0.6em;
      border-radius: 50%;
    }
  }

  .cv-bar {
    display: block;
    height: 0.45em;
    border-radius: 1em;
    overflow: hidden;

    span {
      display: block;
      height: 100%;
      border-radius: inherit;
    }
  }

  .cv-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 1.2cqw;
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      padding: 0.5cqw 1.8cqw;
      border-radius: 5cqw;
      font-size: 0.85em;
      word-break: break-word;
    }
  }

  .cv-inline-list {
    margin: 0;
    word-break: break-word;
  }
`;

/** Page height in `cqw` (A4 is 297 / 210 of its width). */
export const CV_PAGE_HEIGHT_CQW = (297 / 210) * 100;

/**
 * `percent`% of the page height. Vertical sections use this instead of a plain
 * `%`, because a CV can run over several pages and only the page height is fixed.
 */
export const pageHeightPercent = (percent: number) =>
  `calc(${percent} * ${CV_PAGE_HEIGHT_CQW / 100}cqw)`;
