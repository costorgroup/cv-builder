"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import CreateCvMenu from "@/components/create-cv-menu";
import CvSearch from "@/components/cv-search";
import TopNav from "@/components/top-nav";
import {
  SDashboardLayout,
  SDashboardLayoutContent,
  SDashboardLayoutSearch,
} from "@/layouts/dashboard-layout/styles";
import type {
  TDashboardLayoutPage,
  TDashboardLayoutProps,
} from "@/layouts/dashboard-layout/types";
import { AuthProvider, useAuth } from "@/providers/auth-provider";
import { signInPath } from "@/utils/auth-routes";

const PAGES: Record<string, TDashboardLayoutPage> = {
  "/dashboard": {
    title: "My CVs",
    description: "Find, edit and download the CVs you've made",
    searchable: true,
  },
};

const DEFAULT_PAGE: TDashboardLayoutPage = {
  title: "CV Builder",
  description: "Build a CV that gets you noticed",
};

/**
 * The proxy only sees that a session cookie exists; if the API then says the
 * session is gone (e.g. revoked elsewhere), send the user to sign in.
 */
const RequireSignIn = () => {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "signed-out") router.replace(signInPath(pathname));
  }, [status, router, pathname]);

  return null;
};

const DashboardLayout = ({ children }: TDashboardLayoutProps) => {
  const pathname = usePathname();
  const { title, description, searchable } = PAGES[pathname] ?? DEFAULT_PAGE;

  return (
    <AuthProvider>
      <RequireSignIn />
      <SDashboardLayout>
        <TopNav homeHref="/dashboard" title={title} description={description}>
          {searchable && (
            <SDashboardLayoutSearch>
              <Suspense>
                <CvSearch />
              </Suspense>
            </SDashboardLayoutSearch>
          )}
          <CreateCvMenu />
        </TopNav>
        <SDashboardLayoutContent>{children}</SDashboardLayoutContent>
      </SDashboardLayout>
    </AuthProvider>
  );
};

export default DashboardLayout;
