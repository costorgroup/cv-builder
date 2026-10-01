import type { TFeature } from "@repo/cv-core";

export type TLockedFeaturesNoticeProps = {
  /** Only these features; all of them when not given. */
  features?: TFeature[];
  className?: string;
};
