"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowBottomIcon,
  Avatar,
  Button,
  Divider,
  Flex,
  MenuItem,
  Skeleton,
  Small,
  Strong,
  useMenu,
} from "@costor/ui";
import ButtonLink from "@/components/button-link";
import { SignOutIcon } from "@/components/account-nav/icons";
import {
  SAccountNav,
  SAccountNavMenu,
  SAccountNavMenuSection,
  SAccountNavProfile,
  SAccountNavSignIn,
  SAccountNavTrigger,
  SAccountNavUser,
} from "@/components/account-nav/styles";
import type { TAccountNavMenuItem } from "@/components/account-nav/types";
import { useAuth } from "@/providers/auth-provider";
import type { TSideNavGroup } from "@/components/side-nav/types";
import {
  ADMIN_NAV_GROUPS,
  DASHBOARD_NAV_GROUPS,
  isAdmin,
} from "@/layouts/dashboard-layout/nav";
import { fullName } from "@/utils/auth-api";

/** A dashboard section, opened at its first page. */
const groupItem = ({ label, icon, items }: TSideNavGroup) => ({
  label,
  icon,
  href: items[0]?.href ?? "",
});

const DASHBOARD_ITEMS: TAccountNavMenuItem[] =
  DASHBOARD_NAV_GROUPS.map(groupItem);

/** The admin area's sections, for platform admins only. */
const ADMIN_ITEMS: TAccountNavMenuItem[] = ADMIN_NAV_GROUPS.map(groupItem);

const SIGN_OUT_ITEM: TAccountNavMenuItem = {
  label: "Sign out",
  href: "/auth/sign-out",
  icon: <SignOutIcon />,
  color: "error",
};

/** Sign in / sign up, or the signed-in user with their account menu. */
export const AccountNav = () => {
  const auth = useAuth();
  const router = useRouter();
  const { triggerProps, menuProps, close } = useMenu({
    placement: "bottom-end",
    offset: 8,
  });

  if (auth.status === "loading") {
    return (
      <SAccountNav align="center" gap={2.5} aria-busy>
        <Skeleton width={36} height={36} radius="full" />
        <Flex direction="column" gap={1}>
          <Skeleton width={110} height={12} />
          <Skeleton width={150} height={10} />
        </Flex>
      </SAccountNav>
    );
  }

  if (auth.status === "signed-out") {
    return (
      <SAccountNav align="center" gap={2}>
        <SAccountNavSignIn as={ButtonLink} href="/auth/sign-in" variant="ghost">
          Sign in
        </SAccountNavSignIn>
        <Button
          as={ButtonLink}
          href="/auth/sign-up"
          variant="solid"
          color="primary"
        >
          Create account
        </Button>
      </SAccountNav>
    );
  }

  const { user } = auth;
  const name = fullName(user);
  // Only links: the admin area checks the role on the server.
  const sections = [
    DASHBOARD_ITEMS,
    ...(isAdmin(user.role) ? [ADMIN_ITEMS] : []),
    [SIGN_OUT_ITEM],
  ];
  const renderItem = (item: TAccountNavMenuItem) => (
    <MenuItem
      key={item.href}
      color={item.color}
      onClick={() => {
        close();
        router.push(item.href);
      }}
    >
      <Flex align="center" gap={2.5}>
        {item.icon}
        {item.label}
      </Flex>
    </MenuItem>
  );
  return (
    <SAccountNav align="center">
      <SAccountNavTrigger type="button" {...triggerProps}>
        <Avatar name={name} size="sm" radius="full" />
        <SAccountNavUser direction="column">
          <Strong>{name}</Strong>
          <Small color="secondary">{user.email}</Small>
        </SAccountNavUser>
        <ArrowBottomIcon />
      </SAccountNavTrigger>
      <SAccountNavMenu {...menuProps}>
        <SAccountNavProfile>
          <Avatar name={name} size="lg" radius="full" />
          <Strong>{name}</Strong>
          <Small color="secondary">{user.email}</Small>
        </SAccountNavProfile>
        {sections.map((items) => (
          <Fragment key={items[0]?.href}>
            <Divider />
            <SAccountNavMenuSection>
              {items.map(renderItem)}
            </SAccountNavMenuSection>
          </Fragment>
        ))}
      </SAccountNavMenu>
    </SAccountNav>
  );
};

export default AccountNav;
