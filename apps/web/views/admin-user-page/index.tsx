"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  DataTable,
  Flex,
  Heading,
  Skeleton,
  Small,
  Strong,
} from "@costor/ui";
import ButtonLink from "@/components/button-link";
import SettingsCard from "@/components/settings-card";
import UsageMeter from "@/components/usage-meter";
import WideTable from "@/components/wide-table";
import { useAuth } from "@/providers/auth-provider";
import { isConfirmCancelled, useConfirm } from "@/providers/confirm-provider";
import {
  adminApi,
  adminBillingApi,
  type TAdminUserDetail,
  type TEntitlementValues,
  type TPlatformRole,
} from "@/utils/admin-api";
import EntitlementsEditor, {
  toEntitlementValues,
} from "@/components/entitlements-editor";
import type { TEntitlementsDraft } from "@/components/entitlements-editor/types";
import { ADMIN_USERS_PATH } from "@/utils/admin-path";
import { ApiError } from "@/utils/api-client";
import { formatBytes } from "@/utils/format-bytes";
import {
  SAdminUserPage,
  SAdminUserPageFacts,
  SAdminUserPageRole,
} from "@/views/admin-user-page/styles";
import ValueSelect from "@/components/value-select";

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});
const dateOrNever = (iso: string | null) =>
  iso ? dateTime.format(new Date(iso)) : "Never";

const ROLE_OPTIONS: { value: TPlatformRole; label: string }[] = [
  { value: "USER", label: "User" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super admin" },
];

const messageOf = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Couldn't reach the server. Try again.";

/** "CV_DELETED" → "CV deleted", for the activity list. */
const actionLabel = (action: string) =>
  (
    action.charAt(0) + action.slice(1).toLowerCase().replaceAll("_", " ")
  ).replace(/^Cv(?= )/, "CV");

const Fact = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Flex direction="column" gap={0.5}>
    <Small color="secondary">{label}</Small>
    <Strong>{value}</Strong>
  </Flex>
);

/**
 * Extras on top of the account's plan (e.g. more CVs for an early user).
 * They apply whatever plan it's on; super admins set them.
 */
const ExtrasCard = ({
  subscriptionId,
  overrides,
  canEdit,
  onSaved,
}: {
  subscriptionId: string;
  overrides: Partial<TEntitlementValues> | null;
  canEdit: boolean;
  onSaved: () => Promise<unknown>;
}) => {
  const [draft, setDraft] = useState<TEntitlementsDraft>({
    features: overrides?.features ?? [],
    limits: overrides?.limits ?? {},
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<
    { success: string } | { error: string }
  >();

  const onSave = async () => {
    setSaving(true);
    setNotice(undefined);
    try {
      await adminBillingApi.setOverrides(
        subscriptionId,
        toEntitlementValues(draft),
      );
      await onSaved();
      setNotice({ success: "Saved. They apply at once." });
    } catch (error) {
      setNotice({ error: messageOf(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsCard
      title="Extra allowances"
      description="On top of the plan: features ticked here are added, and a limit set here replaces the plan's."
      actions={
        canEdit && (
          <Button
            variant="solid"
            color="primary"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? "Saving…" : "Save extras"}
          </Button>
        )
      }
    >
      {notice && (
        <Alert
          color={"error" in notice ? "error" : "success"}
          variant="subtle"
          size="sm"
        >
          {"error" in notice ? notice.error : notice.success}
        </Alert>
      )}
      <EntitlementsEditor
        value={draft}
        onChange={setDraft}
        disabled={!canEdit || saving}
        emptyLimitHint="the plan's"
      />
    </SettingsCard>
  );
};

/** One account: its details, plan, usage and activity, and admin actions. */
const AdminUserPage = ({ id }: { id: string }) => {
  const auth = useAuth();
  const confirm = useConfirm();
  const [user, setUser] = useState<TAdminUserDetail | { error: string }>();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string>();

  const load = useCallback(
    () =>
      adminApi
        .user(id)
        .then(setUser, (error: unknown) =>
          setUser({ error: messageOf(error) }),
        ),
    [id],
  );
  useEffect(() => {
    void load();
  }, [load]);

  if (!user)
    return <Skeleton width="100%" height={420} radius="lg" aria-busy />;
  if ("error" in user) {
    return (
      <Flex direction="column" gap={3}>
        <Alert color="error" variant="subtle">
          {user.error}
        </Alert>
        <Button as={ButtonLink} href={ADMIN_USERS_PATH}>
          Back to users
        </Button>
      </Flex>
    );
  }

  const me = auth.status === "signed-in" ? auth.user : undefined;
  const isMe = me?.id === user.id;
  // What the API allows; it checks again either way.
  const canManage =
    !isMe && (user.role === "USER" || me?.role === "SUPER_ADMIN");
  const canChangeRole = !isMe && me?.role === "SUPER_ADMIN";

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setActionError(undefined);
    try {
      await action();
      await load();
    } catch (error) {
      setActionError(messageOf(error));
    } finally {
      setBusy(false);
    }
  };

  const onToggleDisabled = async () => {
    const disabling = !user.disabledAt;
    try {
      await confirm({
        title: disabling
          ? `Disable ${user.email}?`
          : `Enable ${user.email} again?`,
        description: disabling
          ? "They're signed out everywhere at once and can't sign in until you enable the account again. Their CVs are kept."
          : "They can sign in again.",
        confirmLabel: disabling ? "Disable" : "Enable",
        color: disabling ? "error" : "primary",
      });
    } catch (error) {
      if (isConfirmCancelled(error)) return;
      throw error;
    }
    await run(() => adminApi.setDisabled(user.id, disabling));
  };

  const onRoleChange = async (role: TPlatformRole) => {
    if (role === user.role) return;
    try {
      await confirm({
        title: `Make ${user.email} ${ROLE_OPTIONS.find((each) => each.value === role)?.label.toLowerCase()}?`,
        description:
          role === "USER"
            ? "They lose access to the admin area."
            : "They get access to the admin area and everyone's accounts.",
        confirmLabel: "Change role",
      });
    } catch (error) {
      if (isConfirmCancelled(error)) return;
      throw error;
    }
    await run(() => adminApi.setRole(user.id, role));
  };

  const { subscription, usage } = user;
  return (
    <SAdminUserPage direction="column" gap={5}>
      <Flex align="center" justify="space-between" gap={3} wrap="wrap">
        <Flex direction="column" gap={1}>
          <Flex align="center" gap={2} wrap="wrap">
            <Heading as="h4">
              {user.firstName} {user.lastName}
            </Heading>
            {user.role !== "USER" && (
              <Chip radius="pill" size="sm" variant="subtle" color="primary">
                {ROLE_OPTIONS.find((each) => each.value === user.role)?.label}
              </Chip>
            )}
            <Chip
              radius="pill"
              size="sm"
              variant="subtle"
              color={user.disabledAt ? "error" : "success"}
            >
              {user.disabledAt ? "Disabled" : "Active"}
            </Chip>
          </Flex>
          <Small color="secondary">{user.email}</Small>
        </Flex>
        <Button as={ButtonLink} href={ADMIN_USERS_PATH} variant="ghost">
          All users
        </Button>
      </Flex>

      {actionError && (
        <Alert
          color="error"
          variant="subtle"
          onClose={() => setActionError(undefined)}
        >
          {actionError}
        </Alert>
      )}

      <SettingsCard
        title="Account"
        actions={
          <>
            {canChangeRole && (
              <SAdminUserPageRole>
                <ValueSelect
                  aria-label="Role"
                  size="sm"
                  variant="subtle"
                  disabled={busy}
                  value={user.role}
                  options={ROLE_OPTIONS}
                  onChange={(_, role) => onRoleChange(role as TPlatformRole)}
                />
              </SAdminUserPageRole>
            )}
            {canManage && (
              <Button
                color={user.disabledAt ? "primary" : "error"}
                disabled={busy}
                onClick={onToggleDisabled}
              >
                {user.disabledAt ? "Enable account" : "Disable account"}
              </Button>
            )}
          </>
        }
      >
        <SAdminUserPageFacts>
          <Fact label="Joined" value={dateOrNever(user.createdAt)} />
          <Fact label="Last active" value={dateOrNever(user.lastActiveAt)} />
          <Fact
            label="Email"
            value={user.emailVerifiedAt ? "Verified" : "Not verified"}
          />
          <Fact label="Signed-in devices" value={user.activeSessions} />
          {user.disabledAt && (
            <Fact label="Disabled" value={dateOrNever(user.disabledAt)} />
          )}
        </SAdminUserPageFacts>
      </SettingsCard>

      <SettingsCard title="Subscription">
        {subscription ? (
          <SAdminUserPageFacts>
            <Fact label="Plan" value={subscription.plan.name} />
            <Fact label="Status" value={subscription.status.toLowerCase()} />
            <Fact
              label="Billed"
              value={subscription.price?.period.toLowerCase() ?? "—"}
            />
            <Fact
              label={subscription.cancelAtPeriodEnd ? "Ends" : "Renews"}
              value={dateOrNever(subscription.currentPeriodEnd)}
            />
            <Fact
              label="Payments"
              value={
                subscription.provider === "none"
                  ? "Not paying"
                  : `${subscription.provider} · ${subscription.providerSubscriptionId ?? "—"}`
              }
            />
          </SAdminUserPageFacts>
        ) : (
          <Small color="secondary">No subscription.</Small>
        )}
      </SettingsCard>

      {subscription && (
        <ExtrasCard
          // Kept across reloads, so the "Saved" message stays on screen.
          key={subscription.id}
          subscriptionId={subscription.id}
          overrides={
            subscription.overrides as Partial<TEntitlementValues> | null
          }
          canEdit={me?.role === "SUPER_ADMIN"}
          onSaved={load}
        />
      )}

      {usage && (
        <SettingsCard title="Usage">
          <Flex direction="column" gap={5}>
            <UsageMeter label="Saved CVs" usage={usage.cvs} />
            <UsageMeter
              label="Storage"
              usage={usage.storageBytes}
              format={formatBytes}
            />
            <UsageMeter label="PDFs this month" usage={usage.pdfsThisMonth} />
          </Flex>
        </SettingsCard>
      )}

      <WideTable minWidth={560}>
        <DataTable
          columns={[
            { id: "when", key: "when", name: "When" },
            { id: "what", key: "what", name: "What" },
            { id: "by", key: "by", name: "By" },
            { id: "from", key: "from", name: "From" },
          ]}
          data={user.recentActivity.map((entry) => ({
            id: entry.id,
            when: dateTime.format(new Date(entry.createdAt)),
            what: actionLabel(entry.action),
            by:
              entry.actorType === "SYSTEM"
                ? `System (${entry.actorId ?? "—"})`
                : entry.actorId === user.id
                  ? "Them"
                  : entry.actorId === me?.id
                    ? "You"
                    : "An admin",
            from: entry.ipAddress ?? "—",
          }))}
          size="sm"
          radius="lg"
          title="Recent activity"
          description="The latest things this person did, or were done to their account."
          searchPlaceholder="Search activity"
        />
      </WideTable>
    </SAdminUserPage>
  );
};

export default AdminUserPage;
