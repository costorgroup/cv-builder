"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthMessage from "@/components/auth-message";
import { authApi } from "@/utils/auth-api";

/** Signs out on arrival, then goes to sign in. */
const SignOutPage = () => {
  const router = useRouter();

  useEffect(() => {
    authApi
      .signOut()
      .catch(() => {
        // The API clears the cookies either way; nothing to show.
      })
      .finally(() => {
        router.replace("/auth/sign-in");
        router.refresh();
      });
  }, [router]);

  return <AuthMessage title="Signing out…" />;
};

export default SignOutPage;
