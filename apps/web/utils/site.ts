/** Public-site links and details shared by the nav, footer and legal pages. */

import type { TSectionVariant } from "@costor/ui";

/** Rail style of the home and pricing page sections: halo, dot, line or none. */
export const SECTION_VARIANT: TSectionVariant = "none";

export const SITE_NAME = "CV Builder";

// TODO: replace with the real support address before launch.
export const CONTACT_EMAIL = "support@example.com";

/** Shown as "Last updated" on the legal pages. */
export const LEGAL_LAST_UPDATED = "September 26, 2026";

export type TSiteLink = {
  label: string;
  href: string;
};

/** Home page sections; each id is a section's `id` and URL hash. */
export const HOME_SECTIONS = [
  { id: "features", label: "Features" },
  { id: "templates", label: "Templates" },
  { id: "how-it-works", label: "How it works" },
  { id: "faq", label: "FAQ" },
] as const;

export type THomeSectionId = (typeof HOME_SECTIONS)[number]["id"];

export const PRICING_PATH = "/pricing";

export const LEGAL_LINKS: TSiteLink[] = [
  { label: "Terms of use", href: "/terms-of-use" },
  { label: "Privacy policy", href: "/privacy-policy" },
  { label: "Cookie policy", href: "/cookie-policy" },
  { label: "Third-party tools", href: "/third-party-tools" },
];
