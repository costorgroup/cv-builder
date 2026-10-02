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
  Skeleton,
  UsersIcon,
} from "@costor/ui";
import ButtonLink from "@/components/button-link";
import RequireSignIn from "@/components/require-sign-in";
import SideNav from "@/components/side-nav";
import type { TSideNavGroup } from "@/components/side-nav/types";
import TopNav from "@/components/top-nav";
import { STopNavFrost } from "@/components/top-nav/styles";
import WorkspaceSwitcher from "@/components/workspace-switcher";
import { CodeIcon, SubscriptionIcon } from "@/layouts/dashboard-layout/icons";
import {
  SDashboardLayout,
  SDashboardLayoutAside,
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
  teamStoragePath,
  teamPath,
  teamSettingsPath,
  teamSubscriptionPath,
} from "@/utils/team-path";

const MEMBERS_DESCRIPTION = "Who's in the team, and invites";

const navGroups = (slug: string): TSideNavGroup[] => [
  {
    label: "Team",
    description: "Who's in it, and how it's set up",
    icon: <UsersIcon />,
    items: [
      {
        label: "Members",
        description: MEMBERS_DESCRIPTION,
        href: teamPath(slug),
        exact: true,
      },
      {
        label: "Settings",
        description: "Name, leaving and deleting",
        href: teamSettingsPath(slug),
      },
    ],
  },
  {
    label: "Plan",
    description: "What the team pays for",
    icon: <SubscriptionIcon />,
    items: [
      {
        label: "Subscription",
        description: "The team's plan",
        href: teamSubscriptionPath(slug),
      },
      {
        label: "Storage",
        description: "Where the team's files are kept",
        href: teamStoragePath(slug),
      },
    ],
  },
  {
    label: "Integrations",
    description: "The CV builder in the team's apps and sites",
    icon: <CodeIcon />,
    items: [
      {
        label: "API keys",
        description: "Keys for the team's own apps",
        href: teamApiKeysPath(slug),
      },
      {
        label: "Embeds",
        description: "The CV builder on the team's sites",
        href: teamEmbedsPath(slug),
      },
    ],
  },
];

/** The top bar's line under the team's name, per page. */
const descriptionFor = (groups: TSideNavGroup[], pathname: string) =>
  groups.flatMap((group) => group.items).find(({ href }) => href === pathname)
    ?.description ?? MEMBERS_DESCRIPTION;

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

  const groups = useMemo(() => navGroups(slug), [slug]);

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
      <STopNavFrost>
        <TopNav
          homeHref={teamPath(slug)}
          title={team?.name ?? "Team"}
          description={descriptionFor(groups, pathname)}
        />
      </STopNavFrost>
      <SDashboardLayoutBody>
        <SDashboardLayoutAside>
          <SideNav
            groups={groups}
            label="Team"
            header={<WorkspaceSwitcher />}
          />
        </SDashboardLayoutAside>
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
