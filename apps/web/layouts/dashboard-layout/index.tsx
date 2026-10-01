"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { FileIcon, FolderIcon, UserIcon, UsersIcon } from "@costor/ui";
import CreateCvMenu from "@/components/create-cv-menu";
import CvSearch from "@/components/cv-search";
import RequireSignIn from "@/components/require-sign-in";
import SideNav from "@/components/side-nav";
import type { TSideNavItem } from "@/components/side-nav/types";
import TopNav from "@/components/top-nav";
import WorkspaceSwitcher from "@/components/workspace-switcher";
import {
  CodeIcon,
  EmbedIcon,
  OverviewIcon,
  SecurityIcon,
  SubscriptionIcon,
  UsageIcon,
} from "@/layouts/dashboard-layout/icons";
import {
  SDashboardLayout,
  SDashboardLayoutBody,
  SDashboardLayoutContent,
  SDashboardLayoutSearch,
} from "@/layouts/dashboard-layout/styles";
import type {
  TDashboardLayoutPage,
  TDashboardLayoutProps,
} from "@/layouts/dashboard-layout/types";
import { AuthProvider } from "@/providers/auth-provider";
import { EntitlementsProvider } from "@/providers/entitlements-provider";
import { TeamsProvider } from "@/providers/teams-provider";
import {
  ACCOUNT_PATH,
  DASHBOARD_PATH,
  DEVELOPERS_PATH,
  EMBEDS_PATH,
  MY_CVS_PATH,
  SECURITY_PATH,
  SUBSCRIPTION_PATH,
  TEMPLATES_PATH,
  USAGE_PATH,
} from "@/utils/dashboard-path";
import { TEAMS_PATH } from "@/utils/team-path";

const NAV_ITEMS: TSideNavItem[] = [
  {
    label: "Overview",
    href: DASHBOARD_PATH,
    icon: <OverviewIcon />,
    exact: true,
  },
  { label: "My CVs", href: MY_CVS_PATH, icon: <FileIcon /> },
  { label: "Templates", href: TEMPLATES_PATH, icon: <FolderIcon /> },
  { label: "Usage", href: USAGE_PATH, icon: <UsageIcon /> },
  {
    label: "Subscription",
    href: SUBSCRIPTION_PATH,
    icon: <SubscriptionIcon />,
  },
  { label: "Teams", href: TEAMS_PATH, icon: <UsersIcon /> },
  { label: "Developers", href: DEVELOPERS_PATH, icon: <CodeIcon /> },
  { label: "Embeds", href: EMBEDS_PATH, icon: <EmbedIcon /> },
  { label: "Account", href: ACCOUNT_PATH, icon: <UserIcon /> },
  { label: "Security", href: SECURITY_PATH, icon: <SecurityIcon /> },
];

const PAGES: Record<string, TDashboardLayoutPage> = {
  [DASHBOARD_PATH]: {
    title: "Overview",
    description: "Your plan, what you've used and your latest CVs",
  },
  [MY_CVS_PATH]: {
    title: "My CVs",
    description: "Find, edit and download the CVs you've made",
    searchable: true,
  },
  [TEMPLATES_PATH]: {
    title: "Templates",
    description: "Every layout, ready to start a CV with",
  },
  [USAGE_PATH]: {
    title: "Usage",
    description: "What you've used of your plan",
  },
  [SUBSCRIPTION_PATH]: {
    title: "Subscription",
    description: "Your plan and the plans there are",
  },
  [TEAMS_PATH]: {
    title: "Teams",
    description: "Teams you're in, and new ones",
  },
  [DEVELOPERS_PATH]: {
    title: "Developers",
    description: "Connect your own apps with API keys",
  },
  [EMBEDS_PATH]: {
    title: "Embeds",
    description: "Put the CV builder on your own site",
  },
  [ACCOUNT_PATH]: {
    title: "Account",
    description: "Your profile, email and account",
  },
  [SECURITY_PATH]: {
    title: "Security",
    description: "Your password and signed-in devices",
  },
};

const DEFAULT_PAGE: TDashboardLayoutPage = {
  title: "CV Builder",
  description: "Build a CV that gets you noticed",
};

const DashboardLayout = ({ children }: TDashboardLayoutProps) => {
  const pathname = usePathname();
  const { title, description, searchable } = PAGES[pathname] ?? DEFAULT_PAGE;

  return (
    <AuthProvider>
      <TeamsProvider>
        <EntitlementsProvider>
          <RequireSignIn />
          <SDashboardLayout>
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
            <SDashboardLayoutBody>
              <SideNav
                items={NAV_ITEMS}
                label="Dashboard"
                header={<WorkspaceSwitcher />}
              />
              <SDashboardLayoutContent>{children}</SDashboardLayoutContent>
            </SDashboardLayoutBody>
          </SDashboardLayout>
        </EntitlementsProvider>
      </TeamsProvider>
    </AuthProvider>
  );
};

export default DashboardLayout;
