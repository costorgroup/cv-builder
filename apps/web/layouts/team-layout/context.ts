"use client";

import { createContext, useContext } from "react";
import type { TTeamContextValue } from "@/layouts/team-layout/types";

export const TeamContext = createContext<TTeamContextValue | null>(null);

/** The team whose pages are open; only inside a TeamLayout. */
export const useTeam = () => {
  const value = useContext(TeamContext);
  if (!value) throw new Error("useTeam must be used inside a TeamLayout");
  return value;
};
