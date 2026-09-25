"use client";

import { SAuthLayout, SAuthLayoutCard } from "@/layouts/auth-layout/styles";
import type { TAuthLayoutProps } from "@/layouts/auth-layout/types";

/** A single centered card; placeholder until the auth design lands. */
const AuthLayout = ({ children }: TAuthLayoutProps) => (
  <SAuthLayout>
    <SAuthLayoutCard>{children}</SAuthLayoutCard>
  </SAuthLayout>
);

export default AuthLayout;
