import type { ReactNode } from "react";
import type { TTeamSummary } from "@repo/cv-core";

export type TTeamLayoutProps = {
  /** From the URL: which of the user's teams to show. */
  slug: string;
  children: ReactNode;
};

export type TTeamContextValue = {
  /** The team, with the signed-in user's role in it. */
  team: TTeamSummary;
};
