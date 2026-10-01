"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  FileIcon,
  FolderIcon,
  UsersIcon,
} from "@costor/ui";
import ButtonLink from "@/components/button-link";
import SideNav from "@/components/side-nav";
import type { TSideNavItem } from "@/components/side-nav/types";
import TopNav from "@/components/top-nav";
import type {
  TAdminLayoutPage,
  TAdminLayoutProps,
} from "@/layouts/admin-layout/types";
import {
  OverviewIcon,
  SecurityIcon,
  SubscriptionIcon,
  UsageIcon,
} from "@/layouts/dashboard-layout/icons";
import {
  SDashboardLayout,
  SDashboardLayoutBody,
  SDashboardLayoutContent,
} from "@/layouts/dashboard-layout/styles";
import { AuthProvider, useAuth } from "@/providers/auth-provider";
import {
  ADMIN_AUDIT_LOG_PATH,
  ADMIN_PATH,
  ADMIN_PLANS_PATH,
  ADMIN_SUBSCRIPTIONS_PATH,
  ADMIN_TEMPLATES_PATH,
  ADMIN_USAGE_PATH,
  ADMIN_USERS_PATH,
} from "@/utils/admin-path";
import { signInPath } from "@/utils/auth-routes";
import { DASHBOARD_PATH } from "@/utils/dashboard-path";

const NAV_ITEMS: TSideNavItem[] = [
  { label: "Overview", href: ADMIN_PATH, icon: <OverviewIcon />, exact: true },
  { label: "Users", href: ADMIN_USERS_PATH, icon: <UsersIcon /> },
  {
    label: "Subscriptions",
    href: ADMIN_SUBSCRIPTIONS_PATH,
    icon: <SubscriptionIcon />,
  },
  { label: "Plans", href: ADMIN_PLANS_PATH, icon: <FileIcon /> },
  { label: "Templates", href: ADMIN_TEMPLATES_PATH, icon: <FolderIcon /> },
  { label: "Usage", href: ADMIN_USAGE_PATH, icon: <UsageIcon /> },
  { label: "Audit log", href: ADMIN_AUDIT_LOG_PATH, icon: <SecurityIcon /> },
];

const PAGES: [string, TAdminLayoutPage][] = [
  [
    ADMIN_USERS_PATH,
    { title: "Users", description: "Find accounts and manage their access" },
  ],
  [
    ADMIN_SUBSCRIPTIONS_PATH,
    { title: "Subscriptions", description: "Who's on which plan, and paying" },
  ],
  [
    ADMIN_PLANS_PATH,
    { title: "Plans", description: "What each plan costs and includes" },
  ],
  [
    ADMIN_TEMPLATES_PATH,
    {
      title: "Templates",
      description: "Which templates are offered, and on which plans",
    },
  ],
  [
    ADMIN_USAGE_PATH,
    { title: "Usage", description: "How much the platform is used" },
  ],
  [
    ADMIN_AUDIT_LOG_PATH,
    { title: "Audit log", description: "Who did what, and when" },
  ],
];

const pageFor = (pathname: string): TAdminLayoutPage =>
  PAGES.find(([path]) => pathname.startsWith(path))?.[1] ?? {
    title: "Admin",
    description: "How the platform is doing",
  };

/**
 * Admins only. The API refuses everyone else on every admin request; this
 * just shows non-admins nothing instead of empty pages.
 */
const AdminGate = ({ children }: TAdminLayoutProps) => {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (auth.status === "signed-out") router.replace(signInPath(pathname));
  }, [auth.status, router, pathname]);

  if (auth.status !== "signed-in") return null;
  if (auth.user.role === "USER") {
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
  }
  return (
    <SDashboardLayoutBody>
      <SideNav items={NAV_ITEMS} label="Admin" />
      <SDashboardLayoutContent>{children}</SDashboardLayoutContent>
    </SDashboardLayoutBody>
  );
};

const AdminLayout = ({ children }: TAdminLayoutProps) => {
  const { title, description } = pageFor(usePathname());
  return (
    <AuthProvider>
      <SDashboardLayout>
        <TopNav homeHref={ADMIN_PATH} title={title} description={description} />
        <AdminGate>{children}</AdminGate>
      </SDashboardLayout>
    </AuthProvider>
  );
};

export default AdminLayout;
