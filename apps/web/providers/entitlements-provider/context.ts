"use client";

import { createContext, useContext } from "react";
import type { TEntitlementsContextValue } from "@/providers/entitlements-provider/types";

export const EntitlementsContext =
  createContext<TEntitlementsContextValue | null>(null);

/** The signed-in user's plan and usage; only inside an EntitlementsProvider. */
export const useEntitlements = () => {
  const value = useContext(EntitlementsContext);
  if (!value) {
    throw new Error(
      "useEntitlements must be used inside an EntitlementsProvider",
    );
  }
  return value;
};
