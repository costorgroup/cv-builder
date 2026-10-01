import { SPremiumBadgeIcon } from "@/components/premium-badge/styles";

/** @costor/ui has no lock icon yet. */
export const LockIcon = () => (
  <SPremiumBadgeIcon
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </SPremiumBadgeIcon>
);
