import type { TSavedCv } from "@/utils/cvs-api";

/** What can be done to a CV from its card's menu. */
export type TCvCardAction = "rename" | "duplicate" | "download" | "delete";

export type TCvCardProps = {
  cv: TSavedCv;
  /** Shows the actions menu; without it the card only opens the CV. */
  onAction?: (action: TCvCardAction, cv: TSavedCv) => void;
  /** Disables the menu, e.g. while an action on this CV is running. */
  busy?: boolean;
};
