import type { ReactNode } from "react";

export type THomeFeature = {
  icon: ReactNode;
  title: string;
  description: string;
};

export type THomeStep = {
  title: string;
  description: string;
};

/** A comparison row: [what, CV Builder, a word processor]. */
export type THomeComparisonRow = [string, boolean, boolean];

export type TSHomeHeroPageProps = {
  /** Position in the fan: 0 left, 1 right, 2 front. */
  index: number;
};

export type TSHomeGridProps = {
  columns: number;
};

export type TSHomeComparisonRowProps = {
  header?: boolean;
};
