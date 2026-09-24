"use client";

import { CV_LEVEL_MAX } from "@/providers/cv-provider/items";
import type {
  TTemplateItem,
  TTemplateLevelItem,
} from "@/templates/shared/index";

// Unstyled building blocks shared by templates. Layout comes from
// `templateBlocksCss` (class names below); colors come from props, so each
// template can make them look its own.

/** Work experience, education, projects or certificates. */
export const TemplateEntries = ({ items }: { items: TTemplateItem[] }) => (
  <div className="cv-entries">
    {items.map((item) => (
      <article key={item.id} className="cv-entry">
        <div className="cv-entry-head">
          <h3 className="cv-entry-title">{item.title}</h3>
          {item.date && <span className="cv-entry-date">{item.date}</span>}
        </div>
        {item.subtitle && <p className="cv-entry-subtitle">{item.subtitle}</p>}
        {item.description && (
          <p className="cv-entry-description">{item.description}</p>
        )}
      </article>
    ))}
  </div>
);

export type TTemplateLevelVariant = "stars" | "bar" | "dots" | "text";

type TTemplateLevelProps = {
  level: number;
  /** Filled part. */
  color: string;
  /** Empty part. */
  trackColor: string;
};

const range = Array.from({ length: CV_LEVEL_MAX }, (_, index) => index);

export const TemplateStars = ({
  level,
  color,
  trackColor,
}: TTemplateLevelProps) => (
  <span className="cv-stars" aria-label={`${level} out of ${CV_LEVEL_MAX}`}>
    {range.map((index) => (
      <span
        key={index}
        aria-hidden
        style={{ color: index < level ? color : trackColor }}
      >
        &#9733;
      </span>
    ))}
  </span>
);

export const TemplateDots = ({
  level,
  color,
  trackColor,
}: TTemplateLevelProps) => (
  <span className="cv-dots" aria-label={`${level} out of ${CV_LEVEL_MAX}`}>
    {range.map((index) => (
      <span
        key={index}
        aria-hidden
        style={{ backgroundColor: index < level ? color : trackColor }}
      />
    ))}
  </span>
);

export const TemplateBar = ({
  level,
  color,
  trackColor,
}: TTemplateLevelProps) => (
  <span
    className="cv-bar"
    role="meter"
    aria-valuemin={0}
    aria-valuemax={CV_LEVEL_MAX}
    aria-valuenow={level}
    style={{ backgroundColor: trackColor }}
  >
    <span
      style={{
        width: `${(level / CV_LEVEL_MAX) * 100}%`,
        backgroundColor: color,
      }}
    />
  </span>
);

/** Skills or languages with their level as stars, a bar, dots or text. */
export const TemplateLevels = ({
  items,
  variant,
  color,
  trackColor,
}: {
  items: TTemplateLevelItem[];
  variant: TTemplateLevelVariant;
} & Omit<TTemplateLevelProps, "level">) => (
  <ul className={`cv-levels cv-levels-${variant}`}>
    {items.map((item) => (
      <li key={item.id} className="cv-level">
        <span className="cv-level-name">{item.name}</span>
        {variant === "stars" && (
          <TemplateStars
            level={item.level}
            color={color}
            trackColor={trackColor}
          />
        )}
        {variant === "dots" && (
          <TemplateDots
            level={item.level}
            color={color}
            trackColor={trackColor}
          />
        )}
        {variant === "bar" && (
          <TemplateBar
            level={item.level}
            color={color}
            trackColor={trackColor}
          />
        )}
        {variant === "text" && (
          <span className="cv-level-label" style={{ color }}>
            {item.levelLabel}
          </span>
        )}
      </li>
    ))}
  </ul>
);

/** Skills as chips. `outline` draws a border instead of a fill. */
export const TemplateChips = ({
  items,
  background,
  color,
  outline = false,
}: {
  items: TTemplateLevelItem[];
  background: string;
  color: string;
  outline?: boolean;
}) => (
  <ul className="cv-chips">
    {items.map((item) => (
      <li
        key={item.id}
        title={item.levelLabel}
        style={
          outline
            ? { border: `0.2cqw solid ${background}`, color }
            : { backgroundColor: background, color }
        }
      >
        {item.name}
      </li>
    ))}
  </ul>
);

/** Names only, separated by `separator` (e.g. skills as plain text). */
export const TemplateInlineList = ({
  items,
  separator = ", ",
}: {
  items: TTemplateLevelItem[];
  separator?: string;
}) => (
  <p className="cv-inline-list">
    {items.map((item) => item.name).join(separator)}
  </p>
);
