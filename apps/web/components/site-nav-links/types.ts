export type TSiteNavLink = {
  /** Home section id, or undefined for a page link. */
  sectionId?: string;
  label: string;
  href: string;
};

export type TSSiteNavLinkProps = {
  active?: boolean;
};
