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

/** @costor/ui has no database/storage icon yet. */
export const StorageIcon = () => (
  <LineIcon>
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
  </LineIcon>
);

/** @costor/ui has no left arrow/chevron icon yet. */
export const BackIcon = () => (
  <LineIcon>
    <path d="M15 18l-6-6 6-6" />
  </LineIcon>
);

/** @costor/ui has no crown/plan icon yet. */
export const CrownIcon = () => (
  <LineIcon>
    <path d="M3 7l4.5 4L12 5l4.5 6L21 7l-2 11H5L3 7z" />
  </LineIcon>
);

/** @costor/ui has no PDF file icon yet. */
export const PdfIcon = () => (
  <LineIcon>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
    <path d="M14 3v5h5M8.5 17v-4h1.25a1.25 1.25 0 0 1 0 2.5H8.5M13 13v4h.75a1.75 1.75 0 0 0 1.75-1.75v-.5A1.75 1.75 0 0 0 13.75 13H13" />
  </LineIcon>
);

/** @costor/ui has no lock icon yet. */
export const LockIcon = () => (
  <LineIcon>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4M12 15v2" />
  </LineIcon>
);
