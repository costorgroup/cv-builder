"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IconButton, Menu, MenuItem, useMenu } from "@costor/ui";
import { MenuIcon } from "@/components/site-nav-links/icons";
import {
  SSiteNavLink,
  SSiteNavLinks,
  SSiteNavLinksMenu,
} from "@/components/site-nav-links/styles";
import type { TSiteNavLink } from "@/components/site-nav-links/types";
import { useAuth } from "@/providers/auth-provider";
import { HOME_SECTIONS, PRICING_PATH } from "@/utils/site";

const LINKS: TSiteNavLink[] = [
  ...HOME_SECTIONS.map(({ id, label }) => ({
    sectionId: id,
    label,
    href: `/#${id}`,
  })),
  { label: "Pricing", href: PRICING_PATH },
];

/** In the menu for signed-out visitors; the top bar hides "Sign in" on phones. */
const ACCOUNT_LINKS: TSiteNavLink[] = [
  { label: "Sign in", href: "/auth/sign-in" },
  { label: "Create account", href: "/auth/sign-up" },
];

/** A section counts as current once its top passes this far down the viewport. */
const ACTIVE_OFFSET = 160;

/** The home section scrolled to, or null above the first one. */
const useActiveSection = (enabled: boolean) => {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | null = null;
      for (const { id } of HOME_SECTIONS) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= ACTIVE_OFFSET) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [enabled]);

  return enabled ? active : null;
};

/**
 * Links to the home page sections and to pricing. On the home page they
 * scroll smoothly instead of navigating.
 */
export const SiteNavLinks = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useAuth();
  const onHome = pathname === "/";
  const activeSection = useActiveSection(onHome);
  const { triggerProps, menuProps, close } = useMenu({
    placement: "bottom-start",
    offset: 8,
  });

  const isActive = (link: TSiteNavLink) =>
    link.sectionId ? link.sectionId === activeSection : pathname === link.href;

  /** True when it scrolled on the spot, so nothing needs to navigate. */
  const scrollToSection = (link: TSiteNavLink) => {
    const section = link.sectionId && document.getElementById(link.sectionId);
    if (!onHome || !section) return false;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", link.href);
    return true;
  };

  const onLinkClick = (event: MouseEvent, link: TSiteNavLink) => {
    if (scrollToSection(link)) event.preventDefault();
  };

  return (
    <>
      <SSiteNavLinks aria-label="Site">
        {LINKS.map((link) => (
          <SSiteNavLink
            key={link.href}
            href={link.href}
            active={isActive(link)}
            aria-current={isActive(link) ? "page" : undefined}
            onClick={(event) => onLinkClick(event, link)}
          >
            {link.label}
          </SSiteNavLink>
        ))}
      </SSiteNavLinks>
      <SSiteNavLinksMenu>
        <IconButton
          variant="ghost"
          aria-label="Open site menu"
          title="Menu"
          {...triggerProps}
        >
          <MenuIcon />
        </IconButton>
        <Menu {...menuProps}>
          {[...LINKS, ...(status === "signed-out" ? ACCOUNT_LINKS : [])].map(
            (link) => (
              <MenuItem
                key={link.href}
                onClick={() => {
                  close();
                  if (!scrollToSection(link)) router.push(link.href);
                }}
              >
                {link.label}
              </MenuItem>
            ),
          )}
        </Menu>
      </SSiteNavLinksMenu>
    </>
  );
};

export default SiteNavLinks;
