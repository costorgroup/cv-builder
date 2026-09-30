import { SSiteNavLinksIcon } from "@/components/site-nav-links/styles";

/** @costor/ui has no menu icon yet. */
export const MenuIcon = () => (
  <SSiteNavLinksIcon
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    aria-hidden
  >
    <path d="M4 6h16M4 12h16M4 18h16" />
  </SSiteNavLinksIcon>
);
