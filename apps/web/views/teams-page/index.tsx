"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  DataTable,
  Flex,
  Skeleton,
  Strong,
  type TDataTableColumn,
  TextField,
} from "@costor/ui";
import SettingsCard from "@/components/settings-card";
import { useTeams } from "@/providers/teams-provider";
import { ApiError } from "@/utils/api-client";
import { teamPath } from "@/utils/team-path";
import { TEAM_ROLE_LABELS } from "@/utils/team-roles";
import { teamsApi, type TTeamSummary } from "@/utils/teams-api";
import { SAdminUsersPageLink } from "@/views/admin-users-page/styles";
import { STeamsPageName } from "@/views/teams-page/styles";

type TTeamRow = TTeamSummary & { roleText: string };

const COLUMNS: TDataTableColumn<TTeamRow>[] = [
  {
    id: "name",
    key: "name",
    name: "Team",
    renderCell: ({ row }) => (
      <SAdminUsersPageLink href={teamPath(row.slug)}>
        <Strong>{row.name}</Strong>
      </SAdminUsersPageLink>
    ),
  },
  { id: "role", key: "roleText", name: "Your role" },
];

/**
 * The teams the user is in, and a new one. A team is its own account: it
 * has its own plan, and its owner pays for it.
 */
const TeamsPage = () => {
  const teams = useTeams();
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const onCreate = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const team = await teamsApi.create(name.trim());
      teams.reload();
      router.push(teamPath(team.slug));
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Couldn't reach the server. Try again.",
      );
      setBusy(false);
    }
  };

  const renderTeams = () => {
    if (teams.status === "loading") {
      return <Skeleton width="100%" height={200} radius="lg" aria-busy />;
    }
    if (teams.status === "error") {
      return (
        <Alert color="error" variant="subtle">
          Couldn&apos;t load your teams. Try again in a moment.
        </Alert>
      );
    }
    return (
      <DataTable
        columns={COLUMNS}
        data={teams.teams.map((team) => ({
          ...team,
          roleText: TEAM_ROLE_LABELS[team.role],
        }))}
        size="sm"
        radius="lg"
        title="Your teams"
        description="Teams you own or were invited to. Each has its own plan, members and billing."
        searchPlaceholder="Search teams"
      />
    );
  };

  return (
    <Flex direction="column" gap={5}>
      {renderTeams()}
      <SettingsCard
        title="Create a team"
        description="You'll own it. It starts on the free plan; upgrade it to invite people."
        actions={
          <Button
            variant="solid"
            color="primary"
            disabled={busy || name.trim().length < 2}
            onClick={onCreate}
          >
            {busy ? "Creating…" : "Create team"}
          </Button>
        }
      >
        <STeamsPageName>
          <TextField
            label="Team name"
            size="sm"
            variant="subtle"
            maxLength={80}
            placeholder="e.g. Acme Recruiting"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </STeamsPageName>
        {error && (
          <Alert color="error" variant="subtle" size="sm">
            {error}
          </Alert>
        )}
      </SettingsCard>
    </Flex>
  );
};

export default TeamsPage;
