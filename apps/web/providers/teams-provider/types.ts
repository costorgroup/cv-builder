import type { ReactNode } from "react";
import type { TTeamSummary } from "@repo/cv-core";

export type TTeamsState =
  | { status: "loading" }
  | { status: "ready"; teams: TTeamSummary[] }
  | { status: "error" };

export type TTeamsContextValue = TTeamsState & {
  /** Loads the list again, e.g. after making, leaving or renaming a team. */
  reload: () => void;
};

export type TTeamsProviderProps = {
  children: ReactNode;
};
