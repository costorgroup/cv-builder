"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationItem, NavigationItems, NavigationLogo } from "@costor/ui";
import { ThemeToggle } from "../theme-toggle";
import { SAppNavigation } from "./styles";
import type { TAppNavigationLink, TAppNavigationProps } from "./types";

const LINKS: TAppNavigationLink[] = [
  { href: "/", label: "Home" },
  { href: "/manage-cv", label: "Manage CV" },
];

export const AppNavigation = (props: TAppNavigationProps) => {
  const pathname = usePathname();

  return (
    <SAppNavigation {...props}>
      <NavigationLogo>CV Builder</NavigationLogo>
      <NavigationItems>
        {LINKS.map(({ href, label }) => (
          <NavigationItem
            key={href}
            as={Link}
            href={href}
            active={pathname === href}
          >
            {label}
          </NavigationItem>
        ))}
      </NavigationItems>
      <ThemeToggle />
    </SAppNavigation>
  );
};

export type { TAppNavigationLink, TAppNavigationProps };
