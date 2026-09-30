"use client";

import { useAuth } from "@/providers/auth-provider";
import { cvEditorStepPath } from "@/utils/cv-editor";

/**
 * Where "create my CV" buttons go: the editor when signed in, sign-up
 * otherwise. Needs an AuthProvider above it.
 */
export const useStartCvHref = () => {
  const { status } = useAuth();
  return status === "signed-in" ? cvEditorStepPath() : "/auth/sign-up";
};
