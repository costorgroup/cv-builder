import type { ReactNode } from "react";
import type {
  TAccountOverview,
  TEntitlementsSummary,
  TFeature,
  TTeamSummary,
} from "@repo/cv-core";

export type TEntitlementsState =
  | { status: "loading" }
  | {
      status: "ready";
      entitlements: TEntitlementsSummary;
      /** Plan, subscription and usage, as the dashboard shows them. */
      overview: TAccountOverview;
      /** Same as `overview.usage`. */
      usage: TAccountOverview["usage"];
    }
  /** Couldn't be loaded; the API still enforces the plan on every action. */
  | { status: "error" };

export type TEntitlementsContextValue = TEntitlementsState & {
  /**
   * Whether the plan has the feature. True until that's known, so nothing
   * shows as locked for a moment on plans that have it.
   */
  can: (feature: TFeature) => boolean;
  /** Loads the plan and usage again, e.g. after deleting a CV. */
  reload: () => void;
  /** The team whose plan this is; undefined for the user's own. */
  team?: TTeamSummary;
};

export type TEntitlementsProviderProps = {
  children: ReactNode;
  /** A team to load the plan of, instead of the signed-in user's own. */
  team?: TTeamSummary;
};
