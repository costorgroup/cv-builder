"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "@/providers/auth-provider/context";
import type {
  TAuthContextValue,
  TAuthProviderProps,
  TAuthState,
} from "@/providers/auth-provider/types";
import { authApi } from "@/utils/auth-api";

/** Finds out who is signed in, once, for everything below it. */
export const AuthProvider = ({ children }: TAuthProviderProps) => {
  const [state, setState] = useState<TAuthState>({
    status: "loading",
    user: null,
  });

  const reload = useCallback(
    () =>
      authApi.me().then(
        ({ user }) => setState({ status: "signed-in", user }),
        // Signed out, or the API is down; either way there's no user to show.
        () => setState({ status: "signed-out", user: null }),
      ),
    [],
  );

  useEffect(() => {
    let active = true;
    authApi.me().then(
      ({ user }) => active && setState({ status: "signed-in", user }),
      () => active && setState({ status: "signed-out", user: null }),
    );
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<TAuthContextValue>(
    () => ({ ...state, reload }),
    [state, reload],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { useAuth } from "@/providers/auth-provider/context";
export type { TAuthState } from "@/providers/auth-provider/types";
