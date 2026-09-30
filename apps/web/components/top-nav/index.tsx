"use client";

import Image from "next/image";
import NextLink from "next/link";
import { Heading, Small } from "@costor/ui";
import AccountNav from "@/components/account-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  STopNav,
  STopNavActions,
  STopNavBrand,
  STopNavHeader,
  STopNavTools,
} from "@/components/top-nav/styles";
import type { TTopNavProps } from "@/components/top-nav/types";

/**
 * The app's top bar, shared by the dashboard and the public site. Needs an
 * AuthProvider above it for the account menu.
 */
export const TopNav = ({
  homeHref,
  title,
  description,
  children,
}: TTopNavProps) => (
  <STopNav radius="lg">
    <STopNavBrand>
      <NextLink href={homeHref} aria-label="CV Builder home">
        <Image src="/logo.png" alt="" width={40} height={40} priority />
      </NextLink>
    </STopNavBrand>
    <STopNavHeader>
      <Heading as="h6">{title}</Heading>
      {description && <Small color="secondary">{description}</Small>}
    </STopNavHeader>
    <STopNavTools>{children}</STopNavTools>
    <STopNavActions>
      <ThemeToggle />
      <AccountNav />
    </STopNavActions>
  </STopNav>
);

export default TopNav;
