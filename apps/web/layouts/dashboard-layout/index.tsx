"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@costor/ui";
import ButtonLink from "@/components/button-link";
import CreateCvMenu from "@/components/create-cv-menu";
import CvSearch from "@/components/cv-search";
import RequireSignIn from "@/components/require-sign-in";
import SideNav from "@/components/side-nav";
import { findSideNavItem } from "@/components/side-nav/utils";
import TopNav from "@/components/top-nav";
import { STopNavFrost } from "@/components/top-nav/styles";
import WorkspaceSwitcher from "@/components/workspace-switcher";
import { dashboardNavGroups, isAdmin } from "@/layouts/dashboard-layout/nav";
import {
  SDashboardLayout,
  SDashboardLayoutAside,
  SDashboardLayoutBody,
  SDashboardLayoutContent,
  SDashboardLayoutSearch,
} from "@/layouts/dashboard-layout/styles";
import type {
  TDashboardLayoutPage,
  TDashboardLayoutProps,
} from "@/layouts/dashboard-layout/types";
import { AuthProvider, useAuth } from "@/providers/auth-provider";
import { EntitlementsProvider } from "@/providers/entitlements-provider";
import { TeamsProvider } from "@/providers/teams-provider";
import { ADMIN_PATH } from "@/utils/admin-path";
import { matchesRoute } from "@/utils/auth-routes";
import { DASHBOARD_PATH, MY_CVS_PATH } from "@/utils/dashboard-path";

const DEFAULT_PAGE: TDashboardLayoutPage = {
  title: "CV Builder",
  description: "Build a CV that gets you noticed",
};

/**
 * Admin pages, for admins only. The API refuses everyone else on every admin
 * request; this shows them a "not found" instead of empty pages.
 */
const AdminGate = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();
  if (auth.status !== "signed-in") return null;
  if (isAdmin(auth.user.role)) return children;
  return (
    <Empty variant="surface" radius="lg">
      <EmptyHeader>
        <EmptyTitle>Page not found</EmptyTitle>
        <EmptyDescription>
          This page doesn&apos;t exist, or you don&apos;t have access to it.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button as={ButtonLink} href={DASHBOARD_PATH}>
          Go to your dashboard
        </Button>
      </EmptyContent>
    </Empty>
  );
};

/** The top bar, side nav and page; admins also get the admin area. */
const DashboardShell = ({ children }: TDashboardLayoutProps) => {
  const pathname = usePathname();
  const auth = useAuth();
  const groups = dashboardNavGroups(
    auth.status === "signed-in" ? auth.user.role : undefined,
  );
  const item = findSideNavItem(groups, pathname);
  const { title, description } = item
    ? { title: item.label, description: item.description }
    : DEFAULT_PAGE;
  const searchable = pathname === MY_CVS_PATH;

  return (
    <SDashboardLayout>
      <STopNavFrost>
        <TopNav
          homeHref={DASHBOARD_PATH}
          title={title}
          description={description}
        >
          {searchable && (
            <SDashboardLayoutSearch>
              <Suspense>
                <CvSearch />
              </Suspense>
            </SDashboardLayoutSearch>
          )}
          <CreateCvMenu />
        </TopNav>
      </STopNavFrost>
      <SDashboardLayoutBody>
        <SDashboardLayoutAside>
          <SideNav
            groups={groups}
            label="Dashboard"
            header={<WorkspaceSwitcher />}
          />
        </SDashboardLayoutAside>
        <SDashboardLayoutContent>
          {matchesRoute(pathname, [ADMIN_PATH]) ? (
            <AdminGate>{children}</AdminGate>
          ) : (
            children
          )}
        </SDashboardLayoutContent>
      </SDashboardLayoutBody>
    </SDashboardLayout>
  );
};

const DashboardLayout = ({ children }: TDashboardLayoutProps) => (
  <AuthProvider>
    <TeamsProvider>
      <EntitlementsProvider>
        <RequireSignIn />
        <DashboardShell>{children}</DashboardShell>
      </EntitlementsProvider>
    </TeamsProvider>
  </AuthProvider>
);

export default DashboardLayout;
