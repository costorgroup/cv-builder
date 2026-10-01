"use client";

import { createContext, useContext } from "react";
import type { TTeamsContextValue } from "@/providers/teams-provider/types";

export const TeamsContext = createContext<TTeamsContextValue | null>(null);

/** The signed-in user's teams; only inside a TeamsProvider. */
export const useTeams = () => {
  const value = useContext(TeamsContext);
  if (!value) throw new Error("useTeams must be used inside a TeamsProvider");
  return value;
};
