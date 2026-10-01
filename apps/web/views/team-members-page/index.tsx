"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  DataTable,
  Flex,
  NativeSelect,
  Skeleton,
  Small,
  Strong,
  type TDataTableColumn,
  TextField,
} from "@costor/ui";
import type { TOrganizationRole } from "@repo/cv-core";
import SettingsCard from "@/components/settings-card";
import UpgradePrompt from "@/components/upgrade-prompt";
import UsageMeter from "@/components/usage-meter";
import WideTable from "@/components/wide-table";
import { useTeam } from "@/layouts/team-layout/context";
import { useAuth } from "@/providers/auth-provider";
import { isConfirmCancelled, useConfirm } from "@/providers/confirm-provider";
import { useEntitlements } from "@/providers/entitlements-provider";
import { useTeams } from "@/providers/teams-provider";
import { ApiError } from "@/utils/api-client";
import {
  planRestrictionOf,
  type TPlanRestriction,
} from "@/utils/plan-restriction";
import { teamSubscriptionPath } from "@/utils/team-path";
import { TEAM_ROLE_LABELS } from "@/utils/team-roles";
import {
  teamsApi,
  type TTeamInvite,
  type TTeamMember,
} from "@/utils/teams-api";
import {
  STeamMembersPageEmail,
  STeamMembersPageRole,
} from "@/views/team-members-page/styles";

const shortDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

const messageOf = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Couldn't reach the server. Try again.";

const ROLE_OPTIONS = [
  { value: "MEMBER", label: TEAM_ROLE_LABELS.MEMBER },
  { value: "ADMIN", label: TEAM_ROLE_LABELS.ADMIN },
];

/**
 * A member as the table shows it. The table searches the text of each
 * column, so every column's key holds what it displays.
 */
type TMemberRow = TTeamMember & {
  id: string;
  person: string;
  roleText: string;
  joined: string;
};

type TInviteRow = TTeamInvite & {
  roleText: string;
  invitedByText: string;
  expires: string;
};

type TNotice = { success: string } | { error: string } | TPlanRestriction;

/**
 * Who's in the team. Owners and admins invite people, change roles and
 * remove members; the owner can hand the team over. Everyone can look.
 */
const TeamMembersPage = () => {
  const { team } = useTeam();
  const auth = useAuth();
  const teams = useTeams();
  const entitlements = useEntitlements();
  const confirm = useConfirm();
  const me = auth.status === "signed-in" ? auth.user.id : undefined;
  const isAdmin = team.role !== "MEMBER";
  const isOwner = team.role === "OWNER";

  const [members, setMembers] = useState<TTeamMember[] | { error: string }>();
  const [invites, setInvites] = useState<TTeamInvite[]>([]);
  const [draft, setDraft] = useState<{
    email: string;
    role: TOrganizationRole;
  }>({ email: "", role: "MEMBER" });
  const [busy, setBusy] = useState<string>();
  const [notice, setNotice] = useState<TNotice>();

  const load = useCallback(
    () =>
      Promise.all([
        teamsApi.members(team.id),
        isAdmin ? teamsApi.invites(team.id) : Promise.resolve([]),
      ]).then(
        ([nextMembers, nextInvites]) => {
          setMembers(nextMembers);
          setInvites(nextInvites);
        },
        (error: unknown) => setMembers({ error: messageOf(error) }),
      ),
    [team.id, isAdmin],
  );

  useEffect(() => {
    void load();
  }, [load]);

  /** Runs a change, then shows the team as it is now. */
  const run = async (
    key: string,
    action: () => Promise<unknown>,
    success: string,
  ) => {
    setBusy(key);
    setNotice(undefined);
    try {
      await action();
      await load();
      entitlements.reload();
      setNotice({ success });
    } catch (error) {
      setNotice(planRestrictionOf(error) ?? { error: messageOf(error) });
    } finally {
      setBusy(undefined);
    }
  };

  const confirmed = async (options: Parameters<typeof confirm>[0]) => {
    try {
      await confirm(options);
      return true;
    } catch (error) {
      if (isConfirmCancelled(error)) return false;
      throw error;
    }
  };

  const nameOf = (member: TTeamMember) =>
    `${member.firstName} ${member.lastName}`.trim() || member.email;

  const onRemove = async (member: TTeamMember) => {
    if (
      await confirmed({
        title: `Remove ${nameOf(member)} from ${team.name}?`,
        description:
          "They lose access to the team at once. You can invite them again.",
        confirmLabel: "Remove",
        color: "error",
      })
    ) {
      await run(
        `remove-${member.userId}`,
        () => teamsApi.removeMember(team.id, member.userId),
        `${nameOf(member)} was removed.`,
      );
    }
  };

  const onTransfer = async (member: TTeamMember) => {
    if (
      await confirmed({
        title: `Make ${nameOf(member)} the owner?`,
        description:
          "They take over the team and its billing. You stay in the team as an admin, and can't undo this yourself.",
        confirmLabel: "Make owner",
        color: "error",
      })
    ) {
      await run(
        `transfer-${member.userId}`,
        async () => {
          await teamsApi.transferOwnership(team.id, member.userId);
          // Your role changed, which the layout reads from the team list.
          teams.reload();
        },
        `${nameOf(member)} now owns the team.`,
      );
    }
  };

  const onInvite = async () => {
    const email = draft.email.trim();
    await run(
      "invite",
      () => teamsApi.invite(team.id, email, draft.role),
      `Invite sent to ${email}. The link works for 7 days.`,
    );
    setDraft((current) => ({ ...current, email: "" }));
  };

  if (!members)
    return <Skeleton width="100%" height={420} radius="lg" aria-busy />;
  if ("error" in members) {
    return (
      <Alert color="error" variant="subtle">
        {members.error}
      </Alert>
    );
  }

  const memberColumns: TDataTableColumn<TMemberRow>[] = [
    {
      id: "person",
      key: "person",
      name: "Member",
      renderCell: ({ row }) => (
        <Flex direction="column">
          <Strong>
            {nameOf(row)}
            {row.userId === me && " (you)"}
          </Strong>
          <STeamMembersPageEmail color="secondary">
            {row.email}
          </STeamMembersPageEmail>
        </Flex>
      ),
    },
    {
      id: "role",
      key: "roleText",
      name: "Role",
      renderCell: ({ row }) =>
        isAdmin && row.role !== "OWNER" && row.userId !== me ? (
          <STeamMembersPageRole>
            <NativeSelect
              aria-label={`${nameOf(row)}'s role`}
              size="sm"
              variant="subtle"
              value={row.role}
              options={ROLE_OPTIONS}
              disabled={!!busy}
              onChange={(_, value) =>
                run(
                  `role-${row.userId}`,
                  () =>
                    teamsApi.setRole(
                      team.id,
                      row.userId,
                      value as TOrganizationRole,
                    ),
                  `${nameOf(row)} is now ${TEAM_ROLE_LABELS[value as TOrganizationRole].toLowerCase()}.`,
                )
              }
            />
          </STeamMembersPageRole>
        ) : (
          row.roleText
        ),
    },
    { id: "joined", key: "joined", name: "Joined" },
    ...(isAdmin
      ? [
          {
            id: "actions",
            key: "id",
            name: "",
            renderCell: ({ row }) =>
              row.role !== "OWNER" &&
              row.userId !== me && (
                <Flex gap={2} justify="flex-end" wrap="wrap">
                  {isOwner && (
                    <Button
                      size="sm"
                      disabled={!!busy}
                      onClick={() => onTransfer(row)}
                    >
                      Make owner
                    </Button>
                  )}
                  <Button
                    size="sm"
                    color="error"
                    disabled={!!busy}
                    onClick={() => onRemove(row)}
                  >
                    Remove
                  </Button>
                </Flex>
              ),
          } satisfies TDataTableColumn<TMemberRow>,
        ]
      : []),
  ];

  const inviteColumns: TDataTableColumn<TInviteRow>[] = [
    { id: "email", key: "email", name: "Email" },
    { id: "role", key: "roleText", name: "Role" },
    { id: "invited-by", key: "invitedByText", name: "Invited by" },
    { id: "expires", key: "expires", name: "Expires" },
    {
      id: "revoke",
      key: "id",
      name: "",
      renderCell: ({ row }) => (
        <Button
          size="sm"
          disabled={!!busy}
          onClick={() =>
            run(
              `revoke-${row.id}`,
              () => teamsApi.revokeInvite(team.id, row.id),
              `The invite to ${row.email} was cancelled.`,
            )
          }
        >
          Cancel invite
        </Button>
      ),
    },
  ];

  const seatsMax =
    entitlements.status === "ready"
      ? entitlements.entitlements.limits["org.members.max"]
      : undefined;
  const seatsUsed =
    members.filter(({ role }) => role !== "OWNER").length + invites.length;
  const teamsLocked =
    entitlements.status === "ready" && !entitlements.can("organization.team");
  const upgradeHref = teamSubscriptionPath(team.slug);

  return (
    <Flex direction="column" gap={5}>
      {teamsLocked ? (
        <UpgradePrompt
          restriction={{ kind: "feature", feature: "organization.team" }}
          href={upgradeHref}
        />
      ) : (
        seatsMax !== undefined && (
          <SettingsCard
            title="Seats"
            description="Members besides the owner, and invites that haven't been accepted yet."
          >
            <UsageMeter
              label="Seats used"
              usage={{ used: seatsUsed, max: seatsMax }}
            />
          </SettingsCard>
        )
      )}

      {notice &&
        ("kind" in notice ? (
          <UpgradePrompt restriction={notice} href={upgradeHref} />
        ) : (
          <Alert
            color={"error" in notice ? "error" : "success"}
            variant="subtle"
            onClose={() => setNotice(undefined)}
          >
            {"error" in notice ? notice.error : notice.success}
          </Alert>
        ))}

      <WideTable minWidth={640}>
        <DataTable
          columns={memberColumns}
          data={members.map((member) => ({
            ...member,
            id: member.userId,
            person: `${nameOf(member)} ${member.email}`,
            roleText: TEAM_ROLE_LABELS[member.role],
            joined: shortDate.format(new Date(member.joinedAt)),
          }))}
          size="sm"
          radius="lg"
          title="Members"
          description="Everyone in the team and what they can do. Owners and admins manage members; only the owner handles billing."
          searchPlaceholder="Search by name or email"
        />
      </WideTable>

      {isAdmin && !teamsLocked && (
        <SettingsCard
          title="Invite someone"
          description="We email them a link. They join by signing in, or signing up, with this email."
          actions={
            <Button
              variant="solid"
              color="primary"
              disabled={!!busy || !draft.email.trim()}
              onClick={onInvite}
            >
              {busy === "invite" ? "Sending…" : "Send invite"}
            </Button>
          }
        >
          <Flex gap={3} align="flex-end" wrap="wrap">
            <TextField
              label="Email"
              type="email"
              size="sm"
              variant="subtle"
              placeholder="name@company.com"
              value={draft.email}
              onChange={(event) =>
                setDraft({ ...draft, email: event.target.value })
              }
            />
            <STeamMembersPageRole>
              <NativeSelect
                label="Role"
                size="sm"
                variant="subtle"
                value={draft.role}
                options={isOwner ? ROLE_OPTIONS : ROLE_OPTIONS.slice(0, 1)}
                onChange={(_, value) =>
                  setDraft({ ...draft, role: value as TOrganizationRole })
                }
              />
            </STeamMembersPageRole>
          </Flex>
          {!isOwner && (
            <Small color="secondary">Only the owner can invite admins.</Small>
          )}
        </SettingsCard>
      )}

      {isAdmin && invites.length > 0 && (
        <WideTable minWidth={640}>
          <DataTable
            columns={inviteColumns}
            data={invites.map((invite) => ({
              ...invite,
              roleText: TEAM_ROLE_LABELS[invite.role],
              invitedByText: invite.invitedBy ?? "—",
              expires: shortDate.format(new Date(invite.expiresAt)),
            }))}
            size="sm"
            radius="lg"
            title="Invites"
            description="Sent and not accepted yet. Cancelling one makes its link stop working."
            searchPlaceholder="Search by email"
          />
        </WideTable>
      )}
    </Flex>
  );
};

export default TeamMembersPage;
