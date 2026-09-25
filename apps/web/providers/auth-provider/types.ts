import type { ReactNode } from "react";
import type { TAuthUser } from "@/utils/auth-api";

export type TAuthState =
  | { status: "loading"; user: null }
  | { status: "signed-in"; user: TAuthUser }
  | { status: "signed-out"; user: null };

export type TAuthContextValue = TAuthState & {
  /** Asks the API again who is signed in. */
  reload: () => Promise<void>;
};

export type TAuthProviderProps = {
  children: ReactNode;
};
