import { SDashboardLayoutIcon } from "@/layouts/dashboard-layout/styles";

/** @costor/ui has no overview/grid icon yet. */
export const OverviewIcon = () => (
  <SDashboardLayoutIcon
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </SDashboardLayoutIcon>
);

const LineIcon = ({ children }: { children: React.ReactNode }) => (
  <SDashboardLayoutIcon
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </SDashboardLayoutIcon>
);

/** @costor/ui has no chart icon yet. */
export const UsageIcon = () => (
  <LineIcon>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </LineIcon>
);

/** @costor/ui has no card icon yet. */
export const SubscriptionIcon = () => (
  <LineIcon>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20M6 15h4" />
  </LineIcon>
);

/** @costor/ui has no shield icon yet. */
export const SecurityIcon = () => (
  <LineIcon>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </LineIcon>
);

/** @costor/ui has no code icon yet. */
export const CodeIcon = () => (
  <LineIcon>
    <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
  </LineIcon>
);

/** @costor/ui has no window/embed icon yet. */
export const EmbedIcon = () => (
  <LineIcon>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 13l-2 2 2 2M16 13l2 2-2 2" />
  </LineIcon>
);
