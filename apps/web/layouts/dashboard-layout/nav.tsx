import { FileIcon, FolderIcon, UserIcon, UsersIcon } from "@costor/ui";
import type { TSideNavGroup } from "@/components/side-nav/types";
import {
  CodeIcon,
  OverviewIcon,
  SubscriptionIcon,
} from "@/layouts/dashboard-layout/icons";
import {
  ADMIN_AUDIT_LOG_PATH,
  ADMIN_EMBEDS_PATH,
  ADMIN_PATH,
  ADMIN_PLANS_PATH,
  ADMIN_SUBSCRIPTIONS_PATH,
  ADMIN_TEMPLATES_PATH,
  ADMIN_USAGE_PATH,
  ADMIN_USERS_PATH,
} from "@/utils/admin-path";
import {
  ACCOUNT_PATH,
  DASHBOARD_PATH,
  DEVELOPERS_PATH,
  EMBEDS_PATH,
  MY_CVS_PATH,
  SECURITY_PATH,
  STORAGE_PATH,
  SUBSCRIPTION_PATH,
  TEMPLATES_PATH,
  USAGE_PATH,
} from "@/utils/dashboard-path";
import { TEAMS_PATH } from "@/utils/team-path";

/** The dashboard's sections, for everyone: the side nav and account menu. */
export const DASHBOARD_NAV_GROUPS: TSideNavGroup[] = [
  {
    label: "Dashboard",
    description: "Your plan, what you've used and your latest CVs",
    icon: <OverviewIcon />,
    items: [
      {
        label: "Overview",
        description: "Your plan, what you've used and your latest CVs",
        href: DASHBOARD_PATH,
        exact: true,
      },
    ],
  },
  {
    label: "My Documents",
    description: "Your CVs and the layouts to make them with",
    icon: <FileIcon />,
    items: [
      {
        label: "My CVs",
        description: "Find, edit and download the CVs you've made",
        href: MY_CVS_PATH,
      },
      {
        label: "Templates",
        description: "Every layout, ready to start a CV with",
        href: TEMPLATES_PATH,
      },
    ],
  },
  {
    label: "Plan",
    description: "What you pay for, and what you've used of it",
    icon: <SubscriptionIcon />,
    items: [
      {
        label: "Subscription",
        description: "Your plan and the plans there are",
        href: SUBSCRIPTION_PATH,
      },
      {
        label: "Usage",
        description: "What you've used of your plan",
        href: USAGE_PATH,
      },
      {
        label: "Storage",
        description: "Where your files are kept",
        href: STORAGE_PATH,
      },
    ],
  },
  {
    label: "Integrations",
    description: "The CV builder in your own apps and sites",
    icon: <CodeIcon />,
    items: [
      {
        label: "Developers",
        description: "Connect your own apps with API keys",
        href: DEVELOPERS_PATH,
      },
      {
        label: "Embeds",
        description: "Put the CV builder on your own site",
        href: EMBEDS_PATH,
      },
    ],
  },
  {
    label: "Account",
    description: "You, your sign-in and your teams",
    icon: <UserIcon />,
    items: [
      {
        label: "Account",
        description: "Your profile, email and account",
        href: ACCOUNT_PATH,
      },
      {
        label: "Security",
        description: "Your password and signed-in devices",
        href: SECURITY_PATH,
      },
      {
        label: "Teams",
        description: "Teams you're in, and new ones",
        href: TEAMS_PATH,
      },
    ],
  },
];

/**
 * The admin area's sections, after the others, for platform admins only.
 * The API checks the role on every admin request; this only hides links.
 */
export const ADMIN_NAV_GROUPS: TSideNavGroup[] = [
  {
    label: "Platform",
    description: "How the platform is doing",
    icon: <OverviewIcon />,
    divider: true,
    items: [
      {
        label: "Platform overview",
        description: "How the platform is doing",
        href: ADMIN_PATH,
        exact: true,
      },
      {
        label: "Platform usage",
        description: "How much the platform is used",
        href: ADMIN_USAGE_PATH,
      },
      {
        label: "Audit log",
        description: "Who did what, and when",
        href: ADMIN_AUDIT_LOG_PATH,
      },
    ],
  },
  {
    label: "Customers",
    description: "Accounts and what they pay for",
    icon: <UsersIcon />,
    items: [
      {
        label: "Users",
        description: "Find accounts and manage their access",
        href: ADMIN_USERS_PATH,
      },
      {
        label: "Subscriptions",
        description: "Who's on which plan, and paying",
        href: ADMIN_SUBSCRIPTIONS_PATH,
      },
    ],
  },
  {
    label: "Catalog",
    description: "What the platform offers",
    icon: <FolderIcon />,
    items: [
      {
        label: "Plans",
        description: "What each plan costs and includes",
        href: ADMIN_PLANS_PATH,
      },
      {
        label: "Templates",
        description: "Which templates are offered, and on which plans",
        href: ADMIN_TEMPLATES_PATH,
      },
      {
        label: "Embeds",
        description: "The CV builder on customers' sites",
        href: ADMIN_EMBEDS_PATH,
      },
    ],
  },
];

/** Platform admins see the admin area too. */
export const isAdmin = (role: string) => role !== "USER";

/** The groups a user with `role` sees, if any is known yet. */
export const dashboardNavGroups = (role?: string) =>
  role && isAdmin(role)
    ? [...DASHBOARD_NAV_GROUPS, ...ADMIN_NAV_GROUPS]
    : DASHBOARD_NAV_GROUPS;
