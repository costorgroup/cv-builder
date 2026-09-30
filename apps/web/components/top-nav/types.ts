import type { ReactNode } from "react";

export type TTopNavProps = {
  /** Where the logo links to. */
  homeHref: string;
  title: ReactNode;
  description?: ReactNode;
  /** Page tools after the title (search, create, section links…). */
  children?: ReactNode;
};
