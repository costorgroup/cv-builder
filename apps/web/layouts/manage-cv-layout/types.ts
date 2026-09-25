export type TManageCvLayoutProps = {
  children: React.ReactNode;
  /** Set when editing a saved CV; creating a new one otherwise. */
  cvId?: string;
};

export type TManageCvLayoutContentProps = {
  children: React.ReactNode;
  cvId?: string;
};

/** Loading the saved CV when editing, keyed by its id. */
export type TManageCvLayoutLoad =
  | { cvId: string; cv: import("@/utils/cvs-api").TSavedCv }
  | { cvId: string; error: string; notFound: boolean };

export type TManageCvLayoutNavItem = {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  count?: number;
};

