"use client";

import { Fragment, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Heading,
  Sidebar,
  SidebarItem,
  SidebarItemDescription,
  SidebarItemIcon,
  SidebarItemTitle,
  SidebarSeparator,
  Small,
  Tooltip,
} from "@costor/ui";
import ButtonLink from "@/components/button-link";
import Copyright from "@/components/copyright";
import {
  SSideNav,
  SSideNavCard,
  SSideNavPanel,
  SSideNavPanelHeader,
  SSideNavPanelItems,
  SSideNavRail,
} from "@/components/side-nav/styles";
import type { TSideNavProps } from "@/components/side-nav/types";
import { isSideNavItemActive } from "@/components/side-nav/utils";
import { NAV_TOOLTIP_PANEL, navTooltip } from "@/utils/nav-tooltip";

/**
 * A section's pages (e.g. the dashboard's), grouped: a rail of group icons,
 * and the open group's pages beside it, with the current one marked.
 */
export const SideNav = ({ groups, label, header }: TSideNavProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const routeGroup = Math.max(
    0,
    groups.findIndex((group) =>
      group.items.some((item) => isSideNavItemActive(pathname, item)),
    ),
  );
  // Picking a group goes to its first page. It opens straight away, before
  // that page has loaded; otherwise the current page's group is open. Kept by
  // label: groups can be added later (e.g. the admin ones, once the user has
  // loaded), which would shift an index.
  const [picked, setPicked] = useState<{ pathname: string; label: string }>();
  const pickedIndex =
    picked?.pathname === pathname
      ? groups.findIndex((group) => group.label === picked.label)
      : -1;
  const openIndex = pickedIndex >= 0 ? pickedIndex : routeGroup;
  const open = groups[openIndex];

  const pickGroup = (index: number) => {
    const group = groups[index];
    if (!group) return;
    setPicked({ pathname, label: group.label });
    const first = group.items[0];
    if (index !== routeGroup && first) router.push(first.href);
  };

  return (
    <SSideNav aria-label={label}>
      <SSideNavCard radius="lg">
        <SSideNavRail>
          <Sidebar
            as="div"
            collapsed
            size="lg"
            variant="solid"
            color="primary"
            radius="md"
            gap={2}
          >
            {groups.map((group, index) => (
              <Fragment key={group.label}>
                {group.divider && <SidebarSeparator />}
                <Tooltip
                  placement="right"
                  render={navTooltip(group.label)}
                  slotProps={{ panel: NAV_TOOLTIP_PANEL }}
                >
                  <SidebarItem
                    active={index === openIndex}
                    aria-expanded={index === openIndex}
                    onClick={() => pickGroup(index)}
                  >
                    <SidebarItemIcon>{group.icon}</SidebarItemIcon>
                    <SidebarItemTitle>{group.label}</SidebarItemTitle>
                  </SidebarItem>
                </Tooltip>
              </Fragment>
            ))}
          </Sidebar>
        </SSideNavRail>
        <SSideNavPanel>
          <SSideNavPanelHeader>
            <Heading as="h6">{open?.label}</Heading>
            <Small color="secondary">{open?.description}</Small>
          </SSideNavPanelHeader>
          <SSideNavPanelItems>
            {header}
            <Sidebar as="div" color="primary" radius="md" gap={1}>
              {open?.items.map((item) => (
                <SidebarItem
                  key={item.href}
                  as={ButtonLink}
                  href={item.href}
                  active={isSideNavItemActive(pathname, item)}
                >
                  <SidebarItemTitle>{item.label}</SidebarItemTitle>
                  <SidebarItemDescription>
                    {item.description}
                  </SidebarItemDescription>
                </SidebarItem>
              ))}
            </Sidebar>
          </SSideNavPanelItems>
        </SSideNavPanel>
        <Copyright />
      </SSideNavCard>
    </SSideNav>
  );
};

export default SideNav;
