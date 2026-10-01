"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Flex } from "@costor/ui";
import { useForm } from "react-hook-form";
import FormTextField from "@/components/form-text-field";
import SettingsCard, { SettingsForm } from "@/components/settings-card";
import { useTeam } from "@/layouts/team-layout/context";
import { useAuth } from "@/providers/auth-provider";
import { isConfirmCancelled, useConfirm } from "@/providers/confirm-provider";
import { useTeams } from "@/providers/teams-provider";
import { ApiError } from "@/utils/api-client";
import { TEAMS_PATH } from "@/utils/team-path";
import { teamsApi } from "@/utils/teams-api";

type TNameValues = { name: string };

const messageOf = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Couldn't reach the server. Try again.";

/**
 * The team's name, and leaving or deleting it. Owners and admins rename;
 * anyone but the owner can leave; only the owner deletes.
 */
const TeamSettingsPage = () => {
  const { team } = useTeam();
  const auth = useAuth();
  const teams = useTeams();
  const router = useRouter();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const form = useForm<TNameValues>({ defaultValues: { name: team.name } });
  const canRename = team.role !== "MEMBER";
  const isOwner = team.role === "OWNER";

  /** Asks first; then does it and leaves the team's pages. */
  const leaveFor = async (
    options: Parameters<typeof confirm>[0],
    action: () => Promise<unknown>,
  ) => {
    try {
      await confirm(options);
    } catch (caught) {
      if (isConfirmCancelled(caught)) return;
      throw caught;
    }
    setBusy(true);
    setError(undefined);
    try {
      await action();
      teams.reload();
      router.replace(TEAMS_PATH);
    } catch (caught) {
      setError(messageOf(caught));
      setBusy(false);
    }
  };

  const onLeave = () =>
    auth.status === "signed-in" &&
    leaveFor(
      {
        title: `Leave ${team.name}?`,
        description:
          "You lose access at once. Someone in the team can invite you again.",
        confirmLabel: "Leave team",
        color: "error",
      },
      () => teamsApi.removeMember(team.id, auth.user.id),
    );

  const onDelete = () =>
    leaveFor(
      {
        title: `Delete ${team.name}?`,
        description:
          "Everyone loses access and pending invites stop working. This can't be undone. A paid plan has to be cancelled first.",
        confirmLabel: "Delete team",
        color: "error",
      },
      () => teamsApi.delete(team.id),
    );

  return (
    <Flex direction="column" gap={5}>
      {error && (
        <Alert
          color="error"
          variant="subtle"
          onClose={() => setError(undefined)}
        >
          {error}
        </Alert>
      )}
      {canRename ? (
        <SettingsForm
          title="Team name"
          description="How the team shows to its members and in invites."
          form={form}
          onSubmit={async ({ name }) => {
            await teamsApi.rename(team.id, name.trim());
            // The address keeps its slug; only the name changes.
            teams.reload();
            return "Saved.";
          }}
          submitLabel="Save"
          requireChanges
        >
          <FormTextField<TNameValues>
            name="name"
            label="Name"
            rules={{
              required: "Name is required",
              minLength: { value: 2, message: "At least 2 characters" },
              maxLength: { value: 80, message: "At most 80 characters" },
            }}
            required
          />
        </SettingsForm>
      ) : (
        <SettingsCard
          title="Team name"
          description={`${team.name}. Owners and admins can change it.`}
        />
      )}

      {isOwner ? (
        <SettingsCard
          title="Delete team"
          description="Removes the team for everyone. To leave it instead, make someone else the owner first, on the Members page."
          danger
          actions={
            <Button color="error" disabled={busy} onClick={onDelete}>
              Delete team
            </Button>
          }
        />
      ) : (
        <SettingsCard
          title="Leave team"
          description="You lose access to the team. Your own account and CVs aren't affected."
          danger
          actions={
            <Button color="error" disabled={busy} onClick={onLeave}>
              Leave team
            </Button>
          }
        />
      )}
    </Flex>
  );
};

export default TeamSettingsPage;
