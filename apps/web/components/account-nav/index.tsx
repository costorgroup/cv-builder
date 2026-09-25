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
  Skeleton,
  Small,
  Strong,
  useMenu,
} from "@costor/ui";
import ButtonLink from "@/components/button-link";
import { SignOutIcon } from "@/components/account-nav/icons";
import {
  SAccountNav,
  SAccountNavTrigger,
  SAccountNavUser,
} from "@/components/account-nav/styles";
import type { TAccountNavMenuItem } from "@/components/account-nav/types";
import { useAuth } from "@/providers/auth-provider";
import { fullName } from "@/utils/auth-api";

const MENU_ITEMS: TAccountNavMenuItem[] = [
  { label: "My CVs", href: "/dashboard", icon: <FileIcon /> },
  // No settings page yet; changing the password is the only setting.
  { label: "Settings", href: "/auth/change-password", icon: <SettingsIcon /> },
  { label: "Sign out", href: "/auth/sign-out", icon: <SignOutIcon />, color: "error" },
];

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
        <Button as={ButtonLink} href="/auth/sign-in" variant="ghost">
          Sign in
        </Button>
        <Button as={ButtonLink} href="/auth/sign-up" variant="solid" color="primary">
          Create account
        </Button>
      </SAccountNav>
    );
  }

  const { user } = auth;
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
        {MENU_ITEMS.map((item) => (
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
