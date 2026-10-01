"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  CheckBox,
  Chip,
  DataTable,
  Flex,
  NativeSelect,
  Skeleton,
  Small,
  Strong,
  type TDataTableColumn,
  TextField,
} from "@costor/ui";
import { API_SCOPES } from "@repo/cv-core";
import SettingsCard from "@/components/settings-card";
import UpgradePrompt from "@/components/upgrade-prompt";
import WideTable from "@/components/wide-table";
import { isConfirmCancelled, useConfirm } from "@/providers/confirm-provider";
import { useEntitlements } from "@/providers/entitlements-provider";
import { ApiError } from "@/utils/api-client";
import { apiKeysApi, type TApiKey, type TApiScope } from "@/utils/api-keys-api";
import { SUBSCRIPTION_PATH } from "@/utils/dashboard-path";
import {
  planRestrictionOf,
  type TPlanRestriction,
} from "@/utils/plan-restriction";
import { teamSubscriptionPath } from "@/utils/team-path";
import {
  SApiKeysPageCode,
  SApiKeysPageField,
  SApiKeysPageScopes,
} from "@/views/api-keys-page/styles";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const SCOPE_LABELS: Record<TApiScope, string> = {
  "cv:read": "Read CVs",
  "cv:create": "Create CVs",
  "cv:update": "Edit CVs",
  "cv:delete": "Delete CVs",
  "cv:export": "Download PDFs",
  "template:read": "List templates",
  "usage:read": "Read usage",
  "embed:session": "Start embed sessions",
};

const READ_ONLY: TApiScope[] = ["cv:read", "template:read", "usage:read"];

const EXPIRY_OPTIONS = [
  { value: "", label: "Never" },
  { value: "30", label: "In 30 days" },
  { value: "90", label: "In 90 days" },
  { value: "365", label: "In a year" },
];

const shortDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const dateOr = (iso: string | null, fallback: string) =>
  iso ? shortDate.format(new Date(iso)) : fallback;

const messageOf = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Couldn't reach the server. Try again.";

/**
 * A key as the table shows it. The table searches the text of each column,
 * so every column's key holds what it displays.
 */
type TKeyRow = TApiKey & {
  scopeText: string;
  createdByText: string;
  lastUsed: string;
  expires: string;
};

type TNotice = { error: string } | TPlanRestriction;

/**
 * API keys for connecting other apps: the signed-in user's own, or a
 * team's (inside a team's pages). A new key is shown once.
 */
const ApiKeysPage = () => {
  const entitlements = useEntitlements();
  const confirm = useConfirm();
  const { team } = entitlements;
  const canManage = !team || team.role !== "MEMBER";
  const upgradeHref = team
    ? teamSubscriptionPath(team.slug)
    : SUBSCRIPTION_PATH;

  const [keys, setKeys] = useState<TApiKey[] | { error: string }>();
  const [draft, setDraft] = useState({
    name: "",
    scopes: READ_ONLY,
    expiresInDays: "",
  });
  const [created, setCreated] = useState<{ name: string; key: string }>();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<TNotice>();

  const load = useCallback(
    () =>
      apiKeysApi
        .list(team?.id)
        .then(setKeys, (error: unknown) =>
          setKeys({ error: messageOf(error) }),
        ),
    [team?.id],
  );

  useEffect(() => {
    if (canManage) void load();
  }, [load, canManage]);

  if (!canManage) {
    return (
      <Alert color="info" variant="subtle">
        Only the team&apos;s owner and admins can see and make API keys.
      </Alert>
    );
  }

  const apiLocked =
    entitlements.status === "ready" && !entitlements.can("api.access");

  const onCreate = async () => {
    setBusy(true);
    setNotice(undefined);
    try {
      const { key, apiKey } = await apiKeysApi.create(
        {
          name: draft.name.trim(),
          scopes: draft.scopes,
          expiresInDays: Number(draft.expiresInDays) || undefined,
        },
        team?.id,
      );
      setCreated({ name: apiKey.name, key });
      setCopied(false);
      setDraft({ ...draft, name: "" });
      await load();
    } catch (error) {
      setNotice(planRestrictionOf(error) ?? { error: messageOf(error) });
    } finally {
      setBusy(false);
    }
  };

  const onRevoke = async (key: TApiKey) => {
    try {
      await confirm({
        title: `Revoke "${key.name}"?`,
        description:
          "It stops working at once. Apps using it get an error until they're given a new key.",
        confirmLabel: "Revoke",
        color: "error",
      });
    } catch (error) {
      if (isConfirmCancelled(error)) return;
      throw error;
    }
    try {
      await apiKeysApi.revoke(key.id, team?.id);
      await load();
    } catch (error) {
      setNotice({ error: messageOf(error) });
    }
  };

  const onCopy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.key);
      setCopied(true);
    } catch {
      setNotice({
        error: "Couldn't copy. Select the key and copy it instead.",
      });
    }
  };

  const toggleScope = (scope: TApiScope, on: boolean) =>
    setDraft({
      ...draft,
      scopes: on
        ? API_SCOPES.filter(
            (each) => each === scope || draft.scopes.includes(each),
          )
        : draft.scopes.filter((each) => each !== scope),
    });

  const columns: TDataTableColumn<TKeyRow>[] = [
    {
      id: "name",
      key: "name",
      name: "Key",
      renderCell: ({ row }) => (
        <Flex direction="column">
          <Strong>{row.name}</Strong>
          <SApiKeysPageCode as="span">{row.preview}…</SApiKeysPageCode>
        </Flex>
      ),
    },
    {
      id: "scopes",
      key: "scopeText",
      name: "Can",
      renderCell: ({ row }) => (
        <SApiKeysPageScopes>
          {row.scopes.map((scope) => (
            <Chip key={scope} radius="pill" size="xs" variant="subtle">
              {SCOPE_LABELS[scope]}
            </Chip>
          ))}
        </SApiKeysPageScopes>
      ),
    },
    { id: "created-by", key: "createdByText", name: "Made by" },
    { id: "last-used", key: "lastUsed", name: "Last used" },
    { id: "expires", key: "expires", name: "Expires" },
    {
      id: "revoke",
      key: "id",
      name: "",
      renderCell: ({ row }) => (
        <Button size="sm" color="error" onClick={() => onRevoke(row)}>
          Revoke
        </Button>
      ),
    },
  ];

  const renderKeys = () => {
    if (!keys)
      return <Skeleton width="100%" height={200} radius="lg" aria-busy />;
    if ("error" in keys) {
      return (
        <Alert color="error" variant="subtle">
          {keys.error}
        </Alert>
      );
    }
    return (
      <WideTable minWidth={760}>
        <DataTable
          columns={columns}
          data={keys.map((key) => ({
            ...key,
            scopeText: key.scopes.map((scope) => SCOPE_LABELS[scope]).join(" "),
            createdByText: key.createdBy ?? "—",
            lastUsed: dateOr(key.lastUsedAt, "Never"),
            expires: dateOr(key.expiresAt, "Never"),
          }))}
          size="sm"
          radius="lg"
          title="API keys"
          description={`Keys ${team ? `for ${team.name}` : "for your account"} that still work. Each is checked on every request, so revoking one takes effect at once.`}
          searchPlaceholder="Search keys"
        />
      </WideTable>
    );
  };

  return (
    <Flex direction="column" gap={5}>
      {apiLocked && (
        <UpgradePrompt
          restriction={{ kind: "feature", feature: "api.access" }}
          href={upgradeHref}
        />
      )}
      {notice &&
        ("kind" in notice ? (
          <UpgradePrompt restriction={notice} href={upgradeHref} />
        ) : (
          <Alert
            color="error"
            variant="subtle"
            onClose={() => setNotice(undefined)}
          >
            {notice.error}
          </Alert>
        ))}

      {created && (
        <Alert
          color="success"
          variant="subtle"
          title={`"${created.name}" is ready`}
          onClose={() => setCreated(undefined)}
          actions={
            <Button size="sm" variant="solid" color="success" onClick={onCopy}>
              {copied ? "Copied" : "Copy key"}
            </Button>
          }
        >
          Copy it now and keep it somewhere safe: it won&apos;t be shown again.
          <SApiKeysPageCode>{created.key}</SApiKeysPageCode>
        </Alert>
      )}

      {renderKeys()}

      {!apiLocked && (
        <SettingsCard
          title="Make a key"
          description="Give each app its own key, with only what it needs."
          actions={
            <Button
              variant="solid"
              color="primary"
              disabled={busy || !draft.name.trim() || draft.scopes.length === 0}
              onClick={onCreate}
            >
              {busy ? "Making…" : "Make key"}
            </Button>
          }
        >
          <Flex gap={3} align="flex-end" wrap="wrap">
            <SApiKeysPageField width={280}>
              <TextField
                label="Name"
                size="sm"
                variant="subtle"
                maxLength={60}
                placeholder="e.g. Careers site"
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
              />
            </SApiKeysPageField>
            <SApiKeysPageField width={160}>
              <NativeSelect
                label="Expires"
                size="sm"
                variant="subtle"
                value={draft.expiresInDays}
                options={EXPIRY_OPTIONS}
                onChange={(_, value) =>
                  setDraft({ ...draft, expiresInDays: value })
                }
              />
            </SApiKeysPageField>
          </Flex>
          <Flex direction="column" gap={2}>
            <Flex align="center" gap={2} wrap="wrap">
              <Small color="secondary">It can:</Small>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDraft({ ...draft, scopes: READ_ONLY })}
              >
                Read only
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDraft({ ...draft, scopes: [...API_SCOPES] })}
              >
                Everything
              </Button>
            </Flex>
            <SApiKeysPageScopes>
              {API_SCOPES.map((scope) => (
                <CheckBox
                  key={scope}
                  size="sm"
                  label={SCOPE_LABELS[scope]}
                  checked={draft.scopes.includes(scope)}
                  onChange={(event) => toggleScope(scope, event.target.checked)}
                />
              ))}
            </SApiKeysPageScopes>
          </Flex>
        </SettingsCard>
      )}

      <SettingsCard
        title="Quick start"
        description="Send the key as a bearer token from your server; never put it in a web page."
        actions={
          <Button
            as="a"
            href={`${API_URL}/v1/docs`}
            target="_blank"
            rel="noreferrer"
          >
            API reference
          </Button>
        }
      >
        <SApiKeysPageCode>
          {`curl ${API_URL}/v1/cvs \\\n  -H "Authorization: Bearer cvb_live_…"`}
        </SApiKeysPageCode>
        <Small color="secondary">
          Endpoints: GET, POST /v1/cvs · GET, PATCH, DELETE /v1/cvs/:id · GET
          /v1/cvs/:id/pdf · GET /v1/templates · GET /v1/usage. Each key can make
          up to 120 requests a minute; the plan sets how many a month.
          {team &&
            " Team keys can list templates and usage for now; managing CVs comes with embedded users."}
        </Small>
      </SettingsCard>
    </Flex>
  );
};

export default ApiKeysPage;
