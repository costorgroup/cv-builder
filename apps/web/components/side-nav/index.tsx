"use client";

import { usePathname } from "next/navigation";
import ButtonLink from "@/components/button-link";
import {
  SSideNav,
  SSideNavCard,
  SSideNavItem,
} from "@/components/side-nav/styles";
import type { TSideNavProps } from "@/components/side-nav/types";
import { matchesRoute } from "@/utils/auth-routes";

/** A section's pages (e.g. the dashboard's), with the current one marked. */
export const SideNav = ({ items, label, header }: TSideNavProps) => {
  const pathname = usePathname();

  return (
    <SSideNav aria-label={label}>
      <SSideNavCard radius="lg">
        {header}
        {items.map(({ label: itemLabel, href, icon, exact }) => {
          const active = exact
            ? pathname === href
            : matchesRoute(pathname, [href]);
          return (
            <SSideNavItem
              key={href}
              as={ButtonLink}
              href={href}
              variant={active ? "solid" : "ghost"}
              color={active ? "primary" : "default"}
              fullWidth
              aria-current={active ? "page" : undefined}
            >
              {icon}
              {itemLabel}
            </SSideNavItem>
          );
        })}
      </SSideNavCard>
    </SSideNav>
  );
};

export default SideNav;
