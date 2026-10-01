"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { TeamsContext } from "@/providers/teams-provider/context";
import type {
  TTeamsContextValue,
  TTeamsProviderProps,
  TTeamsState,
} from "@/providers/teams-provider/types";
import { teamsApi } from "@/utils/teams-api";

/**
 * Loads the teams the signed-in user is in, once for everything below it
 * (the workspace switcher, the Teams page, a team's pages). Needs an
 * AuthProvider above it.
 */
export const TeamsProvider = ({ children }: TTeamsProviderProps) => {
  const { status: authStatus } = useAuth();
  const [state, setState] = useState<TTeamsState>({ status: "loading" });
  // Bumped by `reload` to fetch again.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (authStatus !== "signed-in") return;
    const controller = new AbortController();
    teamsApi.list(controller.signal).then(
      (teams) => setState({ status: "ready", teams }),
      () => !controller.signal.aborted && setState({ status: "error" }),
    );
    return () => controller.abort();
  }, [authStatus, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  const value = useMemo<TTeamsContextValue>(
    () => ({ ...state, reload }),
    [state, reload],
  );

  return (
    <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>
  );
};

export { useTeams } from "@/providers/teams-provider/context";
export type { TTeamsState } from "@/providers/teams-provider/types";
