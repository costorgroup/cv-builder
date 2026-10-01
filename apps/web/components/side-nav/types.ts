import type { ReactNode } from "react";

export type TSideNavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  /**
   * Active only on exactly `href`, not on the pages under it (for a section's
   * root, e.g. the dashboard's overview).
   */
  exact?: boolean;
};

export type TSideNavProps = {
  items: TSideNavItem[];
  /** Names the navigation for screen readers, e.g. "Dashboard". */
  label: string;
  /** Above the links, e.g. a workspace switcher. */
  header?: ReactNode;
};
