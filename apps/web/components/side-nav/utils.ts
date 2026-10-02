import type { TSideNavGroup, TSideNavItem } from "@/components/side-nav/types";
import { matchesRoute } from "@/utils/auth-routes";

export const isSideNavItemActive = (pathname: string, item: TSideNavItem) =>
  item.exact ? pathname === item.href : matchesRoute(pathname, [item.href]);

/** The page `pathname` is on, if it's one of the groups'. */
export const findSideNavItem = (groups: TSideNavGroup[], pathname: string) =>
  groups
    .flatMap((group) => group.items)
    .find((item) => isSideNavItemActive(pathname, item));
