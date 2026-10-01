"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { signInPath } from "@/utils/auth-routes";

/**
 * The proxy only sees that a session cookie exists; if the API then says the
 * session is gone (e.g. revoked elsewhere), send the user to sign in. Needs
 * an AuthProvider above it.
 */
export const RequireSignIn = () => {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "signed-out") router.replace(signInPath(pathname));
  }, [status, router, pathname]);

  return null;
};

export default RequireSignIn;
