import type { ReactNode } from "react";
import type { TPublicTemplate } from "@repo/cv-core";
import type { TPublicPlans } from "@/utils/plans-api";

export type THomePageProps = {
  /** From the API; null if it couldn't be reached (the plans are left out). */
  plans: TPublicPlans | null;
  /** Published templates; null if the API couldn't be reached (all shown). */
  templates: TPublicTemplate[] | null;
};

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
