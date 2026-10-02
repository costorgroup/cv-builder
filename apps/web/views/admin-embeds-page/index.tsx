"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  DataTable,
  Flex,
  Skeleton,
  Small,
  Strong,
  type TDataTableColumn,
} from "@costor/ui";
import WideTable from "@/components/wide-table";
import { isConfirmCancelled, useConfirm } from "@/providers/confirm-provider";
import { adminEmbedsApi, type TAdminEmbed } from "@/utils/admin-api";
import { adminUserPath } from "@/utils/admin-path";
import { ApiError } from "@/utils/api-client";
import { SAdminUsersPageLink } from "@/views/admin-users-page/styles";

const shortDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const count = new Intl.NumberFormat("en-US");

const messageOf = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Couldn't reach the server. Try again.";

/**
 * An embed as the table shows it. The table searches the text of each
 * column, so every column's key holds what it displays.
 */
type TEmbedRow = TAdminEmbed & {
  embed: string;
  owner: string;
  sites: string;
  status: string;
  created: string;
};

/** Every account's embeds; an admin can switch one off. */
const AdminEmbedsPage = () => {
  const confirm = useConfirm();
  const [embeds, setEmbeds] = useState<TAdminEmbed[] | { error: string }>();
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  const load = useCallback(
    () =>
      adminEmbedsApi
        .list()
        .then(setEmbeds, (caught: unknown) =>
          setEmbeds({ error: messageOf(caught) }),
        ),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const onToggle = async (embed: TAdminEmbed) => {
    if (!embed.disabled) {
      try {
        await confirm({
          title: `Turn off "${embed.name}"?`,
          description: `The sites showing it (${embed.allowedOrigins.join(", ") || "none"}) stop at once, and open sessions end. Its owner can see it was turned off.`,
          confirmLabel: "Turn off",
          color: "error",
        });
      } catch (caught) {
        if (isConfirmCancelled(caught)) return;
        throw caught;
      }
    }
    setBusy(embed.id);
    setError(undefined);
    try {
      await adminEmbedsApi.setDisabled(embed.id, !embed.disabled);
      await load();
    } catch (caught) {
      setError(messageOf(caught));
    } finally {
      setBusy(undefined);
    }
  };

  if (!embeds)
    return <Skeleton width="100%" height={360} radius="lg" aria-busy />;
  if ("error" in embeds) {
    return (
      <Alert color="error" variant="subtle">
        {embeds.error}
      </Alert>
    );
  }

  const columns: TDataTableColumn<TEmbedRow>[] = [
    {
      id: "embed",
      key: "embed",
      name: "Embed",
      renderCell: ({ row }) => (
        <Flex direction="column">
          <Strong>{row.name}</Strong>
          <Small color="secondary">{row.publicKey}</Small>
        </Flex>
      ),
    },
    {
      id: "owner",
      key: "owner",
      name: "Account",
      renderCell: ({ row }) =>
        row.organization.owner ? (
          <SAdminUsersPageLink href={adminUserPath(row.organization.owner.id)}>
            {row.organization.owner.email}
          </SAdminUsersPageLink>
        ) : (
          <Flex direction="column">
            {row.organization.name}
            <Small color="secondary">Team</Small>
          </Flex>
        ),
    },
    { id: "sites", key: "sites", name: "Sites" },
    {
      id: "users",
      key: "externalUsers",
      name: "Embedded users",
      renderCell: ({ row }) =>
        `${count.format(row.externalUsers)} · ${count.format(row.externalCvs)} CVs`,
    },
    {
      id: "status",
      key: "status",
      name: "Status",
      renderCell: ({ row }) => (
        <Chip
          radius="pill"
          size="xs"
          variant="subtle"
          color={row.disabled ? "default" : "success"}
        >
          {row.status}
        </Chip>
      ),
    },
    { id: "created", key: "created", name: "Made" },
    {
      id: "toggle",
      key: "id",
      name: "",
      renderCell: ({ row }) => (
        <Button
          size="sm"
          color={row.disabled ? "default" : "error"}
          disabled={busy === row.id}
          onClick={() => onToggle(row)}
        >
          {row.disabled ? "Turn on" : "Turn off"}
        </Button>
      ),
    },
  ];

  return (
    <Flex direction="column" gap={4}>
      {error && (
        <Alert
          color="error"
          variant="subtle"
          onClose={() => setError(undefined)}
        >
          {error}
        </Alert>
      )}
      <WideTable minWidth={960}>
        <DataTable
          columns={columns}
          data={embeds.map((embed) => ({
            ...embed,
            embed: `${embed.name} ${embed.publicKey}`,
            owner: embed.organization.owner?.email ?? embed.organization.name,
            sites: embed.allowedOrigins.join(", ") || "None",
            status: embed.disabled ? "Off" : "On",
            created: shortDate.format(new Date(embed.createdAt)),
          }))}
          size="sm"
          radius="lg"
          title="Embeds"
          description="The CV builder on customers' sites, newest first. Embedded users and CVs are counted per account."
          searchPlaceholder="Search by name, account or site"
        />
      </WideTable>
    </Flex>
  );
};

export default AdminEmbedsPage;
