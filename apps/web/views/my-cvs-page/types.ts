import type { ReactNode } from "react";
import type { TCvList, TSavedCv } from "@/utils/cvs-api";
import type { TPlanRestriction } from "@/utils/plan-restriction";

export type TMyCvsPageProps = {
  /** From `?search=`. */
  search?: string;
  /** From `?page=`, 1-based. */
  page?: number;
};

/** The last response, and which search/page it answers. */
export type TMyCvsPageResult =
  { key: string; list: TCvList } | { key: string; error: string };

/** What the last action on a CV left to say: a plan refusal or an error. */
export type TMyCvsPageNotice =
  { restriction: TPlanRestriction } | { error: string };

export type TMyCvsEmptyProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export type TRenameCvModalProps = {
  /** The CV being renamed; closed when unset. */
  cv?: TSavedCv;
  onClose: () => void;
  onRenamed: () => void;
};
