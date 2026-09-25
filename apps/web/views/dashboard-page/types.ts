import type { ReactNode } from "react";
import type { TCvList, TSavedCv } from "@/utils/cvs-api";

export type TDashboardPageProps = {
  /** From `?search=`. */
  search?: string;
  /** From `?page=`, 1-based. */
  page?: number;
};

/** The last response, and which search/page it answers. */
export type TDashboardPageResult =
  { key: string; list: TCvList } | { key: string; error: string };

export type TDashboardPageCvCardProps = {
  cv: TSavedCv;
};

export type TDashboardEmptyProps = {
  title: string;
  description: string;
  action?: ReactNode;
};
