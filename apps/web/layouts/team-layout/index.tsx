"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  SettingsIcon,
  Skeleton,
  UsersIcon,
} from "@costor/ui";
import ButtonLink from "@/components/button-link";
import RequireSignIn from "@/components/require-sign-in";
import SideNav from "@/components/side-nav";
import type { TSideNavItem } from "@/components/side-nav/types";
import TopNav from "@/components/top-nav";
import WorkspaceSwitcher from "@/components/workspace-switcher";
import {
  CodeIcon,
  EmbedIcon,
  SubscriptionIcon,
} from "@/layouts/dashboard-layout/icons";
import {
  SDashboardLayout,
  SDashboardLayoutBody,
  SDashboardLayoutContent,
} from "@/layouts/dashboard-layout/styles";
import { TeamContext } from "@/layouts/team-layout/context";
import type { TTeamLayoutProps } from "@/layouts/team-layout/types";
import { AuthProvider } from "@/providers/auth-provider";
import { EntitlementsProvider } from "@/providers/entitlements-provider";
import { TeamsProvider, useTeams } from "@/providers/teams-provider";
import {
  TEAMS_PATH,
  teamApiKeysPath,
  teamEmbedsPath,
  teamPath,
  teamSettingsPath,
  teamSubscriptionPath,
} from "@/utils/team-path";

/** The top bar's line under the team's name, per page. */
const descriptionFor = (pathname: string, slug: string) => {
  if (pathname === teamSubscriptionPath(slug)) return "The team's plan";
  if (pathname === teamSettingsPath(slug)) return "Name, leaving and deleting";
  if (pathname === teamApiKeysPath(slug)) return "Keys for the team's own apps";
  if (pathname === teamEmbedsPath(slug))
    return "The CV builder on the team's sites";
  return "Who's in the team, and invites";
};

const TeamNotFound = () => (
  <Empty variant="surface" radius="lg">
    <EmptyHeader>
      <EmptyTitle>Team not found</EmptyTitle>
      <EmptyDescription>
        This team doesn&apos;t exist, or you&apos;re not in it.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button as={ButtonLink} href={TEAMS_PATH}>
        See your teams
      </Button>
    </EmptyContent>
  </Empty>
);

/** The team from the URL, once the user's teams are loaded. */
const TeamShell = ({ slug, children }: TTeamLayoutProps) => {
  const teams = useTeams();
  const pathname = usePathname();
  const team =
    teams.status === "ready"
      ? teams.teams.find((each) => each.slug === slug)
      : undefined;
  const context = useMemo(() => team && { team }, [team]);

  const items: TSideNavItem[] = [
    {
      label: "Members",
      href: teamPath(slug),
      icon: <UsersIcon />,
      exact: true,
    },
    {
      label: "Subscription",
      href: teamSubscriptionPath(slug),
      icon: <SubscriptionIcon />,
    },
    { label: "API keys", href: teamApiKeysPath(slug), icon: <CodeIcon /> },
    { label: "Embeds", href: teamEmbedsPath(slug), icon: <EmbedIcon /> },
    { label: "Settings", href: teamSettingsPath(slug), icon: <SettingsIcon /> },
  ];

  const renderContent = () => {
    if (teams.status === "loading") {
      return <Skeleton width="100%" height={360} radius="lg" aria-busy />;
    }
    if (!context) return <TeamNotFound />;
    return (
      <TeamContext.Provider value={context}>
        <EntitlementsProvider team={context.team}>
          {children}
        </EntitlementsProvider>
      </TeamContext.Provider>
    );
  };

  return (
    <SDashboardLayout>
      <TopNav
        homeHref={teamPath(slug)}
        title={team?.name ?? "Team"}
        description={descriptionFor(pathname, slug)}
      />
      <SDashboardLayoutBody>
        <SideNav items={items} label="Team" header={<WorkspaceSwitcher />} />
        <SDashboardLayoutContent>{renderContent()}</SDashboardLayoutContent>
      </SDashboardLayoutBody>
    </SDashboardLayout>
  );
};

/**
 * A team's pages, for its members. The API checks membership and role on
 * every request; this shows people outside the team a "not found".
 */
const TeamLayout = ({ slug, children }: TTeamLayoutProps) => (
  <AuthProvider>
    <RequireSignIn />
    <TeamsProvider>
      <TeamShell slug={decodeURIComponent(slug)}>{children}</TeamShell>
    </TeamsProvider>
  </AuthProvider>
);

export default TeamLayout;
export { useTeam } from "@/layouts/team-layout/context";
