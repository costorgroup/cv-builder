"use client";

import { createContext, useContext } from "react";
import type { TAuthContextValue } from "@/providers/auth-provider/types";

export const AuthContext = createContext<TAuthContextValue | null>(null);

/** The signed-in user; only inside an AuthProvider. */
export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside an AuthProvider");
  return value;
};
