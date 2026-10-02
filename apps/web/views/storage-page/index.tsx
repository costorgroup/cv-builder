"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Flex,
  Skeleton,
  Small,
  TextField,
} from "@costor/ui";
import SettingsCard from "@/components/settings-card";
import UpgradePrompt from "@/components/upgrade-prompt";
import UsageMeter from "@/components/usage-meter";
import { isConfirmCancelled, useConfirm } from "@/providers/confirm-provider";
import { useEntitlements } from "@/providers/entitlements-provider";
import { ApiError } from "@/utils/api-client";
import { SUBSCRIPTION_PATH } from "@/utils/dashboard-path";
import { formatBytes } from "@/utils/format-bytes";
import {
  planRestrictionOf,
  type TPlanRestriction,
} from "@/utils/plan-restriction";
import { storageApi, type TStorageConfig } from "@/utils/storage-api";
import { teamSubscriptionPath } from "@/utils/team-path";
import { SStoragePageFields } from "@/views/storage-page/styles";

const messageOf = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Couldn't reach the server. Try again.";

const longDate = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

type TDraft = {
  bucket: string;
  region: string;
  endpoint: string;
  prefix: string;
  accessKeyId: string;
  secretAccessKey: string;
};

const EMPTY: TDraft = {
  bucket: "",
  region: "",
  endpoint: "",
  prefix: "",
  accessKeyId: "",
  secretAccessKey: "",
};

const draftOf = (config: TStorageConfig | null): TDraft =>
  config
    ? {
        bucket: config.bucket,
        region: config.region,
        endpoint: config.endpoint ?? "",
        prefix: config.prefix,
        accessKeyId: "",
        secretAccessKey: "",
      }
    : EMPTY;

type TNotice = { success: string } | { error: string } | TPlanRestriction;

/**
 * Where files are kept: how much of the plan's storage is used, and an
 * organization's own S3-compatible bucket for new uploads. The secret is
 * never shown again once saved.
 */
const StoragePage = () => {
  const entitlements = useEntitlements();
  const confirm = useConfirm();
  const { team } = entitlements;
  const canManage = !team || team.role !== "MEMBER";
  const upgradeHref = team
    ? teamSubscriptionPath(team.slug)
    : SUBSCRIPTION_PATH;

  const [config, setConfig] = useState<
    TStorageConfig | null | { error: string }
  >();
  const [draft, setDraft] = useState<TDraft>(EMPTY);
  const [busy, setBusy] = useState<string>();
  const [notice, setNotice] = useState<TNotice>();

  const load = useCallback(
    () =>
      storageApi.get(team?.id).then(
        ({ storage }) => {
          setConfig(storage);
          setDraft(draftOf(storage));
        },
        (error: unknown) => setConfig({ error: messageOf(error) }),
      ),
    [team?.id],
  );

  useEffect(() => {
    if (canManage) void load();
  }, [load, canManage]);

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
      setNotice({ success });
    } catch (error) {
      setNotice(planRestrictionOf(error) ?? { error: messageOf(error) });
    } finally {
      setBusy(undefined);
    }
  };

  const usage =
    entitlements.status === "ready"
      ? entitlements.usage.storageBytes
      : undefined;
  const externalLocked =
    entitlements.status === "ready" && !entitlements.can("storage.external");
  const current = config && !("error" in config) ? config : null;

  const onSave = () =>
    run(
      "save",
      () =>
        storageApi.save(
          {
            bucket: draft.bucket.trim(),
            region: draft.region.trim(),
            endpoint: draft.endpoint.trim() || undefined,
            prefix: draft.prefix.trim() || undefined,
            ...(draft.accessKeyId.trim() && {
              accessKeyId: draft.accessKeyId.trim(),
              secretAccessKey: draft.secretAccessKey,
            }),
          },
          team?.id,
        ),
      "Saved. Test the connection to start using it.",
    );

  const onRemove = async () => {
    try {
      await confirm({
        title: "Disconnect this bucket?",
        description:
          "New uploads come back to our storage. Files already in your bucket stay there, but CVs can't show them any more.",
        confirmLabel: "Disconnect",
        color: "error",
      });
    } catch (error) {
      if (isConfirmCancelled(error)) return;
      throw error;
    }
    await run("remove", () => storageApi.remove(team?.id), "Disconnected.");
  };

  const status = () => {
    if (!current) return null;
    if (current.active) {
      return (
        <Chip radius="pill" size="xs" variant="subtle" color="success">
          In use
        </Chip>
      );
    }
    return (
      <Chip radius="pill" size="xs" variant="subtle" color="warning">
        {current.verifiedAt ? "Not in your plan" : "Not checked yet"}
      </Chip>
    );
  };

  return (
    <Flex direction="column" gap={5}>
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

      <SettingsCard
        title="Storage used"
        description="CVs and their photos kept with us. Files in your own bucket don't count."
      >
        {usage ? (
          <UsageMeter label="Storage" usage={usage} format={formatBytes} />
        ) : (
          <Skeleton width="100%" height={40} />
        )}
      </SettingsCard>

      {!canManage ? (
        <Alert color="info" variant="subtle">
          Only the team&apos;s owner and admins can change where its files are
          kept.
        </Alert>
      ) : externalLocked ? (
        <UpgradePrompt
          restriction={{ kind: "feature", feature: "storage.external" }}
          href={upgradeHref}
        />
      ) : config === undefined ? (
        <Skeleton width="100%" height={320} radius="lg" aria-busy />
      ) : config && "error" in config ? (
        <Alert color="error" variant="subtle">
          {config.error}
        </Alert>
      ) : (
        <SettingsCard
          title="Your own bucket"
          description="Keep photos in an S3-compatible bucket you own: AWS S3, Cloudflare R2, MinIO and others. CV text stays with us. Once it's checked, new uploads go there; files already stored stay where they are."
          actions={
            <>
              {current && (
                <Button color="error" disabled={!!busy} onClick={onRemove}>
                  Disconnect
                </Button>
              )}
              {current && (
                <Button
                  disabled={!!busy}
                  onClick={() =>
                    run(
                      "verify",
                      () => storageApi.verify(team?.id),
                      "Connected: new uploads now go to your bucket.",
                    )
                  }
                >
                  {busy === "verify" ? "Testing…" : "Test connection"}
                </Button>
              )}
              <Button
                variant="solid"
                color="primary"
                disabled={
                  !!busy || !draft.bucket.trim() || !draft.region.trim()
                }
                onClick={onSave}
              >
                Save
              </Button>
            </>
          }
        >
          {current && (
            <Flex align="center" gap={2} wrap="wrap">
              {status()}
              <Small color="secondary">
                {current.verifiedAt
                  ? `Last checked ${longDate.format(new Date(current.verifiedAt))}.`
                  : "Saved, but new uploads don't go there until the test passes."}{" "}
                Access key {current.accessKey}.
              </Small>
            </Flex>
          )}
          <SStoragePageFields>
            <TextField
              label="Bucket"
              size="sm"
              variant="subtle"
              placeholder="acme-cv-photos"
              value={draft.bucket}
              onChange={(event) =>
                setDraft({ ...draft, bucket: event.target.value })
              }
            />
            <TextField
              label="Region"
              size="sm"
              variant="subtle"
              placeholder="eu-central-1 (or auto for R2)"
              value={draft.region}
              onChange={(event) =>
                setDraft({ ...draft, region: event.target.value })
              }
            />
            <TextField
              label="Endpoint"
              size="sm"
              variant="subtle"
              placeholder="Leave empty for AWS"
              helperText="For other S3-compatible services, e.g. https://<account>.r2.cloudflarestorage.com"
              value={draft.endpoint}
              onChange={(event) =>
                setDraft({ ...draft, endpoint: event.target.value })
              }
            />
            <TextField
              label="Folder"
              size="sm"
              variant="subtle"
              placeholder="Optional, e.g. cv-builder/"
              value={draft.prefix}
              onChange={(event) =>
                setDraft({ ...draft, prefix: event.target.value })
              }
            />
            <TextField
              label="Access key id"
              size="sm"
              variant="subtle"
              autoComplete="off"
              placeholder={current ? `Saved (${current.accessKey})` : ""}
              value={draft.accessKeyId}
              onChange={(event) =>
                setDraft({ ...draft, accessKeyId: event.target.value })
              }
            />
            <TextField
              label="Secret access key"
              type="password"
              size="sm"
              variant="subtle"
              autoComplete="new-password"
              placeholder={current ? "Saved; enter to change" : ""}
              value={draft.secretAccessKey}
              onChange={(event) =>
                setDraft({ ...draft, secretAccessKey: event.target.value })
              }
            />
          </SStoragePageFields>
          <Small color="secondary">
            The key needs to read, write, list and delete objects in this bucket
            (and folder) only. It&apos;s encrypted when stored and never shown
            again.
          </Small>
        </SettingsCard>
      )}
    </Flex>
  );
};

export default StoragePage;
