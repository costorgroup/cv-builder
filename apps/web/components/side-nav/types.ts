import type { ReactNode } from "react";

export type TSideNavItem = {
  label: string;
  /** Under the label in the side nav, and the page's line in the top bar. */
  description: string;
  href: string;
  /**
   * Active only on exactly `href`, not on the pages under it (for a section's
   * root, e.g. the dashboard's overview).
   */
  exact?: boolean;
};

/** A rail icon; picking it lists its pages beside the rail. */
export type TSideNavGroup = {
  label: string;
  description: string;
  icon: ReactNode;
  /** Starts a new set of groups, with a line before it in the rail. */
  divider?: boolean;
  items: TSideNavItem[];
};

export type TSideNavProps = {
  groups: TSideNavGroup[];
  /** Names the navigation for screen readers, e.g. "Dashboard". */
  label: string;
  /** Above the links, e.g. a workspace switcher. */
  header?: ReactNode;
};
