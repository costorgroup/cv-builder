"use client";

import { useRouter } from "next/navigation";
import {
  ArrowBottomIcon,
  Avatar,
  Button,
  FileIcon,
  Flex,
  Menu,
  MenuItem,
  SettingsIcon,
  UsersIcon,
  Skeleton,
  Small,
  Strong,
  useMenu,
} from "@costor/ui";
import ButtonLink from "@/components/button-link";
import { SignOutIcon } from "@/components/account-nav/icons";
import {
  SAccountNav,
  SAccountNavSignIn,
  SAccountNavTrigger,
  SAccountNavUser,
} from "@/components/account-nav/styles";
import type { TAccountNavMenuItem } from "@/components/account-nav/types";
import { useAuth } from "@/providers/auth-provider";
import { fullName } from "@/utils/auth-api";
import { ADMIN_PATH } from "@/utils/admin-path";
import { ACCOUNT_PATH, MY_CVS_PATH } from "@/utils/dashboard-path";

const MENU_ITEMS: TAccountNavMenuItem[] = [
  { label: "My CVs", href: MY_CVS_PATH, icon: <FileIcon /> },
  { label: "Settings", href: ACCOUNT_PATH, icon: <SettingsIcon /> },
  { label: "Sign out", href: "/auth/sign-out", icon: <SignOutIcon />, color: "error" },
];

/** For platform admins, before signing out. */
const ADMIN_ITEM: TAccountNavMenuItem = {
  label: "Admin",
  href: ADMIN_PATH,
  icon: <UsersIcon />,
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
        <Button as={ButtonLink} href="/auth/sign-up" variant="solid" color="primary">
          Create account
        </Button>
      </SAccountNav>
    );
  }

  const { user } = auth;
  // Only a link: the admin area checks the role on the server.
  const menuItems =
    user.role === "USER"
      ? MENU_ITEMS
      : [...MENU_ITEMS.slice(0, -1), ADMIN_ITEM, ...MENU_ITEMS.slice(-1)];
  const name = fullName(user);
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
      <Menu {...menuProps}>
        {menuItems.map((item) => (
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
        ))}
      </Menu>
    </SAccountNav>
  );
};

export default AccountNav;
