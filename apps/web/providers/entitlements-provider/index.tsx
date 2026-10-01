"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TFeature } from "@repo/cv-core";
import { useAuth } from "@/providers/auth-provider";
import { EntitlementsContext } from "@/providers/entitlements-provider/context";
import type {
  TEntitlementsContextValue,
  TEntitlementsProviderProps,
  TEntitlementsState,
} from "@/providers/entitlements-provider/types";
import { accountApi } from "@/utils/account-api";
import { teamsApi } from "@/utils/teams-api";

/**
 * Loads what the signed-in user's plan allows, and how much of it they use,
 * once for everything below it; with `team`, the team's plan instead. Needs an AuthProvider above it. Only for
 * showing limits and upgrade prompts: the API checks the plan itself.
 */
export const EntitlementsProvider = ({
  children,
  team,
}: TEntitlementsProviderProps) => {
  const { status: authStatus } = useAuth();
  const [state, setState] = useState<TEntitlementsState>({
    status: "loading",
  });
  // Bumped by `reload` to fetch again.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (authStatus !== "signed-in") return;
    const controller = new AbortController();
    Promise.all(
      team
        ? [
            teamsApi.entitlements(team.id, controller.signal),
            teamsApi.overview(team.id, controller.signal),
          ]
        : [
            accountApi.entitlements(controller.signal),
            accountApi.overview(controller.signal),
          ],
    ).then(
      ([entitlements, overview]) =>
        setState({
          status: "ready",
          entitlements,
          overview,
          usage: overview.usage,
        }),
      () => !controller.signal.aborted && setState({ status: "error" }),
    );
    return () => controller.abort();
  }, [authStatus, version, team]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  const value = useMemo<TEntitlementsContextValue>(() => {
    const features =
      state.status === "ready"
        ? new Set<TFeature>(state.entitlements.features)
        : undefined;
    return {
      ...state,
      can: (feature) => !features || features.has(feature),
      reload,
      team,
    };
  }, [state, reload, team]);

  return (
    <EntitlementsContext.Provider value={value}>
      {children}
    </EntitlementsContext.Provider>
  );
};

export { useEntitlements } from "@/providers/entitlements-provider/context";
export type { TEntitlementsState } from "@/providers/entitlements-provider/types";
