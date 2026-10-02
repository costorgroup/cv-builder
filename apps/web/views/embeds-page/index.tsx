"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  CheckBox,
  Chip,
  DataTable,
  Flex,
  Modal,
  Skeleton,
  Small,
  Strong,
  type TDataTableColumn,
  TextArea,
  TextField,
} from "@costor/ui";
import {
  CV_EDITOR_STEPS,
  type TCvEditorStep,
  type TEmbedConfig,
} from "@repo/cv-core";
import SettingsCard from "@/components/settings-card";
import UpgradePrompt from "@/components/upgrade-prompt";
import WideTable from "@/components/wide-table";
import { isConfirmCancelled, useConfirm } from "@/providers/confirm-provider";
import { useEntitlements } from "@/providers/entitlements-provider";
import { ApiError } from "@/utils/api-client";
import { SUBSCRIPTION_PATH } from "@/utils/dashboard-path";
import { embedsApi, type TEmbedInput } from "@/utils/embeds-api";
import {
  planRestrictionOf,
  type TPlanRestriction,
} from "@/utils/plan-restriction";
import { useTemplateCatalog } from "@/utils/template-catalog";
import { teamSubscriptionPath } from "@/utils/team-path";
import { SApiKeysPageCode } from "@/views/api-keys-page/styles";
import {
  SEmbedsPagePreview,
  SEmbedsPageChecks,
  SEmbedsPageColor,
  SEmbedsPageField,
} from "@/views/embeds-page/styles";
import ValueSelect from "@/components/value-select";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const STEP_LABELS: Record<TCvEditorStep, string> = {
  templates: "Templates",
  appearance: "Appearance",
  "personal-information": "Personal information",
  "social-media": "Social media",
  "work-experience": "Work experience",
  education: "Education",
  skills: "Skills",
  languages: "Languages",
  projects: "Projects",
  certificates: "Certificates",
  interests: "Interests",
};

const messageOf = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Couldn't reach the server. Try again.";

/** What the form edits; text fields as typed. */
type TDraft = {
  name: string;
  origins: string;
  primaryColor: string;
  mode: "" | "light" | "dark";
  radius: string;
  companyName: string;
  logoUrl: string;
  showPlatformBranding: boolean;
  templateIds: string[];
  sections: TCvEditorStep[];
  downloads: boolean;
  disabled: boolean;
};

const draftOf = (embed: TEmbedConfig): TDraft => ({
  name: embed.name,
  origins: embed.allowedOrigins.join("\n"),
  primaryColor: embed.theme.primaryColor ?? "",
  mode: embed.theme.mode ?? "",
  radius: embed.theme.radius === undefined ? "" : String(embed.theme.radius),
  companyName: embed.branding.companyName ?? "",
  logoUrl: embed.branding.logoUrl ?? "",
  showPlatformBranding: embed.branding.showPlatformBranding !== false,
  templateIds: embed.templateIds,
  sections: embed.sections,
  downloads: embed.features.includes("pdf.download"),
  disabled: embed.disabled,
});

const inputOf = (draft: TDraft): TEmbedInput => ({
  name: draft.name.trim(),
  allowedOrigins: draft.origins
    .split(/\s+/)
    .map((each) => each.trim())
    .filter(Boolean),
  theme: {
    ...(draft.primaryColor && { primaryColor: draft.primaryColor }),
    ...(draft.mode && { mode: draft.mode }),
    ...(draft.radius !== "" && { radius: Number(draft.radius) }),
  },
  branding: {
    companyName: draft.companyName.trim(),
    logoUrl: draft.logoUrl.trim(),
    showPlatformBranding: draft.showPlatformBranding,
  },
  templateIds: draft.templateIds,
  sections: draft.sections,
  features: draft.downloads ? ["pdf.download"] : [],
  disabled: draft.disabled,
});

/** What to put on the customer's page, and what their server calls. */
const snippetOf = (embed: TEmbedConfig) => {
  const web = typeof window === "undefined" ? "" : window.location.origin;
  return {
    page: `<div id="cv-builder"></div>
<script src="${web}/embed/v1/cv-builder.js"></script>
<script>
  // launchToken: from your server (below), for the signed-in visitor.
  const builder = CvBuilder.mount("#cv-builder", {
    publicKey: "${embed.publicKey}",
    launchToken,
    onEvent: (type, detail) => {
      // "ready", "saved" ({ id, name }), or "session-expired":
      // get a new launch token and call builder.relaunch(token).
    },
  });
</script>`,
    server: `curl -X POST ${API_URL}/v1/embed/sessions \\
  -H "Authorization: Bearer cvb_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{"publicKey":"${embed.publicKey}","externalUserId":"<your user id>"}'`,
  };
};

type TNotice = { success: string } | { error: string } | TPlanRestriction;

/**
 * Embeds: the CV builder on other sites, for their own users. Set where it
 * may appear, how it looks and what it offers; copy the snippet. Owners and
 * admins of a team manage its embeds.
 */
const EmbedsPage = () => {
  const entitlements = useEntitlements();
  const catalog = useTemplateCatalog();
  const confirm = useConfirm();
  const { team } = entitlements;
  const canManage = !team || team.role !== "MEMBER";
  const upgradeHref = team
    ? teamSubscriptionPath(team.slug)
    : SUBSCRIPTION_PATH;

  const [embeds, setEmbeds] = useState<TEmbedConfig[] | { error: string }>();
  const [editing, setEditing] = useState<string>();
  const [draft, setDraft] = useState<TDraft>();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string>();
  /** The embed's address with a one-time token, while previewing. */
  const [preview, setPreview] = useState<string>();
  const [notice, setNotice] = useState<TNotice>();

  const load = useCallback(
    () =>
      embedsApi
        .list(team?.id)
        .then(setEmbeds, (error: unknown) =>
          setEmbeds({ error: messageOf(error) }),
        ),
    [team?.id],
  );

  useEffect(() => {
    if (canManage) void load();
  }, [load, canManage]);

  if (!canManage) {
    return (
      <Alert color="info" variant="subtle">
        Only the team&apos;s owner and admins can see and change embeds.
      </Alert>
    );
  }

  const embedLocked =
    entitlements.status === "ready" && !entitlements.can("embed.builder");
  const whitelabel = entitlements.can("embed.whitelabel");
  const current =
    embeds && !("error" in embeds)
      ? embeds.find(({ id }) => id === editing)
      : undefined;

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setNotice(undefined);
    try {
      await action();
      await load();
      setNotice({ success });
    } catch (error) {
      setNotice(planRestrictionOf(error) ?? { error: messageOf(error) });
    } finally {
      setBusy(false);
    }
  };

  const onCreate = () =>
    run(async () => {
      const created = await embedsApi.create(
        { name: "Careers site" },
        team?.id,
      );
      setEditing(created.id);
      setDraft(draftOf(created));
    }, "Embed made. Add the sites it may appear on, then copy the snippet.");

  const onEdit = (embed: TEmbedConfig) => {
    setEditing(embed.id);
    setDraft(draftOf(embed));
    setNotice(undefined);
  };

  const onSave = () =>
    current &&
    draft &&
    run(
      () => embedsApi.update(current.id, inputOf(draft), team?.id),
      "Saved. Open builders pick it up on their next request.",
    );

  const onDelete = async () => {
    if (!current) return;
    try {
      await confirm({
        title: `Delete "${current.name}"?`,
        description:
          "Sites using it stop showing the builder. The people who used it, and their CVs, stay with your account.",
        confirmLabel: "Delete",
        color: "error",
      });
    } catch (error) {
      if (isConfirmCancelled(error)) return;
      throw error;
    }
    await run(async () => {
      await embedsApi.remove(current.id, team?.id);
      setEditing(undefined);
      setDraft(undefined);
    }, "Embed deleted.");
  };

  const onPreview = async () => {
    if (!current) return;
    setBusy(true);
    setNotice(undefined);
    try {
      const { launchToken } = await embedsApi.preview(current.id, team?.id);
      setPreview(
        `/embed/${current.publicKey}#launch=${encodeURIComponent(launchToken)}`,
      );
    } catch (error) {
      setNotice(planRestrictionOf(error) ?? { error: messageOf(error) });
    } finally {
      setBusy(false);
    }
  };

  const onCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
    } catch {
      setNotice({
        error: "Couldn't copy. Select the text and copy it instead.",
      });
    }
  };

  const toggle = <T extends string>(list: T[], item: T, on: boolean) =>
    on ? [...list, item] : list.filter((each) => each !== item);

  const columns: TDataTableColumn<TEmbedConfig & { sites: string }>[] = [
    {
      id: "name",
      key: "name",
      name: "Embed",
      renderCell: ({ row }) => (
        <Flex direction="column">
          <Strong>{row.name}</Strong>
          <Small color="secondary">{row.publicKey}</Small>
        </Flex>
      ),
    },
    { id: "sites", key: "sites", name: "Sites" },
    {
      id: "status",
      key: "disabled",
      name: "Status",
      renderCell: ({ row }) => (
        <Chip
          radius="pill"
          size="xs"
          variant="subtle"
          color={row.disabled ? "default" : "success"}
        >
          {row.disabled ? "Off" : "On"}
        </Chip>
      ),
    },
    {
      id: "edit",
      key: "id",
      name: "",
      renderCell: ({ row }) => (
        <Button size="sm" onClick={() => onEdit(row)}>
          Edit
        </Button>
      ),
    },
  ];

  const renderList = () => {
    if (!embeds)
      return <Skeleton width="100%" height={200} radius="lg" aria-busy />;
    if ("error" in embeds) {
      return (
        <Alert color="error" variant="subtle">
          {embeds.error}
        </Alert>
      );
    }
    return (
      <WideTable minWidth={640}>
        <DataTable
          columns={columns}
          data={embeds.map((embed) => ({
            ...embed,
            sites: embed.allowedOrigins.join(", ") || "None yet",
          }))}
          size="sm"
          radius="lg"
          title="Embeds"
          description="The CV builder on your own sites, for your own users. They don't need a CV Builder account."
          searchPlaceholder="Search embeds"
        />
      </WideTable>
    );
  };

  const snippet = current && snippetOf(current);

  return (
    <Flex direction="column" gap={5}>
      {embedLocked && (
        <UpgradePrompt
          restriction={{ kind: "feature", feature: "embed.builder" }}
          href={upgradeHref}
        />
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

      {renderList()}
      {!embedLocked && !current && (
        <Flex>
          <Button
            variant="solid"
            color="primary"
            disabled={busy}
            onClick={onCreate}
          >
            New embed
          </Button>
        </Flex>
      )}

      {current && draft && (
        <SettingsCard
          title={`Edit "${current.name}"`}
          description={`Public key ${current.publicKey}: safe to put in a web page.`}
          actions={
            <>
              <Button color="error" disabled={busy} onClick={onDelete}>
                Delete
              </Button>
              <Button
                disabled={busy}
                onClick={() => {
                  setEditing(undefined);
                  setDraft(undefined);
                }}
              >
                Close
              </Button>
              <Button disabled={busy || current.disabled} onClick={onPreview}>
                Preview
              </Button>
              <Button
                variant="solid"
                color="primary"
                disabled={busy || !draft.name.trim()}
                onClick={onSave}
              >
                Save
              </Button>
            </>
          }
        >
          <Flex direction="column" gap={4}>
            <SEmbedsPageField width={360}>
              <TextField
                label="Name"
                size="sm"
                variant="subtle"
                maxLength={60}
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
              />
            </SEmbedsPageField>
            <TextArea
              label="Sites it may appear on"
              size="sm"
              variant="subtle"
              rows={3}
              placeholder={"https://careers.example.com\nhttps://example.com"}
              helperText="One per line, https only (http://localhost works for testing). Browsers refuse to show it anywhere else."
              value={draft.origins}
              onChange={(event) =>
                setDraft({ ...draft, origins: event.target.value })
              }
            />
            <Flex gap={3} align="flex-end" wrap="wrap">
              <SEmbedsPageColor>
                <input
                  type="color"
                  aria-label="Brand color"
                  value={draft.primaryColor || "#4f46e5"}
                  onChange={(event) =>
                    setDraft({ ...draft, primaryColor: event.target.value })
                  }
                />
              </SEmbedsPageColor>
              <SEmbedsPageField width={140}>
                <TextField
                  label="Brand color"
                  size="sm"
                  variant="subtle"
                  placeholder="Default"
                  value={draft.primaryColor}
                  onChange={(event) =>
                    setDraft({ ...draft, primaryColor: event.target.value })
                  }
                />
              </SEmbedsPageField>
              <SEmbedsPageField width={180}>
                <ValueSelect
                  label="Light or dark"
                  size="sm"
                  variant="subtle"
                  value={draft.mode}
                  options={[
                    { value: "", label: "Visitor's setting" },
                    { value: "light", label: "Light" },
                    { value: "dark", label: "Dark" },
                  ]}
                  onChange={(_, value) =>
                    setDraft({ ...draft, mode: value as TDraft["mode"] })
                  }
                />
              </SEmbedsPageField>
              <SEmbedsPageField width={140}>
                <TextField
                  label="Corner radius"
                  type="number"
                  size="sm"
                  variant="subtle"
                  placeholder="Default"
                  value={draft.radius}
                  onChange={(event) =>
                    setDraft({ ...draft, radius: event.target.value })
                  }
                />
              </SEmbedsPageField>
            </Flex>
            <Flex gap={3} wrap="wrap">
              <SEmbedsPageField width={240}>
                <TextField
                  label="Company name"
                  size="sm"
                  variant="subtle"
                  maxLength={60}
                  value={draft.companyName}
                  onChange={(event) =>
                    setDraft({ ...draft, companyName: event.target.value })
                  }
                />
              </SEmbedsPageField>
              <SEmbedsPageField width={360}>
                <TextField
                  label="Logo address"
                  size="sm"
                  variant="subtle"
                  placeholder="https://example.com/logo.png"
                  value={draft.logoUrl}
                  onChange={(event) =>
                    setDraft({ ...draft, logoUrl: event.target.value })
                  }
                />
              </SEmbedsPageField>
            </Flex>
            <CheckBox
              size="sm"
              label='Show "Made with CV Builder"'
              disabled={!whitelabel}
              checked={!whitelabel || draft.showPlatformBranding}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  showPlatformBranding: event.target.checked,
                })
              }
            />
            {!whitelabel && (
              <Small color="secondary">
                Hiding it needs a plan with white-label embeds.
              </Small>
            )}

            <Flex direction="column" gap={2}>
              <Small color="secondary">
                Templates offered (none ticked: every template the plan
                includes)
              </Small>
              <SEmbedsPageChecks>
                {(catalog.status === "loading" ? [] : catalog.templates).map(
                  (template) => (
                    <CheckBox
                      key={template.id}
                      size="sm"
                      label={template.name}
                      checked={draft.templateIds.includes(template.id)}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          templateIds: toggle(
                            draft.templateIds,
                            template.id,
                            event.target.checked,
                          ),
                        })
                      }
                    />
                  ),
                )}
              </SEmbedsPageChecks>
            </Flex>
            <Flex direction="column" gap={2}>
              <Small color="secondary">
                Steps shown (none ticked: all of them)
              </Small>
              <SEmbedsPageChecks>
                {CV_EDITOR_STEPS.map((step) => (
                  <CheckBox
                    key={step}
                    size="sm"
                    label={STEP_LABELS[step]}
                    checked={draft.sections.includes(step)}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        sections: toggle(
                          draft.sections,
                          step,
                          event.target.checked,
                        ),
                      })
                    }
                  />
                ))}
              </SEmbedsPageChecks>
            </Flex>
            <CheckBox
              size="sm"
              label="Let people download their CV as a PDF"
              checked={draft.downloads}
              onChange={(event) =>
                setDraft({ ...draft, downloads: event.target.checked })
              }
            />
            <CheckBox
              size="sm"
              label="Turned off (sites stop showing it)"
              checked={draft.disabled}
              onChange={(event) =>
                setDraft({ ...draft, disabled: event.target.checked })
              }
            />
          </Flex>
        </SettingsCard>
      )}

      {snippet && (
        <SettingsCard
          title="Add it to your site"
          description="Your server asks for a launch token for the signed-in visitor (with an API key that can start embed sessions), and your page passes it to the builder. Tokens work once, within a minute."
        >
          <Flex direction="column" gap={2}>
            <Flex align="center" justify="space-between" gap={2}>
              <Strong>On your page</Strong>
              <Button size="sm" onClick={() => onCopy("page", snippet.page)}>
                {copied === "page" ? "Copied" : "Copy"}
              </Button>
            </Flex>
            <SApiKeysPageCode>{snippet.page}</SApiKeysPageCode>
          </Flex>
          <Flex direction="column" gap={2}>
            <Flex align="center" justify="space-between" gap={2}>
              <Strong>On your server</Strong>
              <Button
                size="sm"
                onClick={() => onCopy("server", snippet.server)}
              >
                {copied === "server" ? "Copied" : "Copy"}
              </Button>
            </Flex>
            <SApiKeysPageCode>{snippet.server}</SApiKeysPageCode>
          </Flex>
        </SettingsCard>
      )}
      <Modal
        open={!!preview}
        onClose={() => setPreview(undefined)}
        title="Preview"
        size="lg"
      >
        <Small color="secondary">
          As a visitor sees it, with the saved settings. You preview as a
          separate test user: what you make here isn't anyone else&apos;s, and
          doesn&apos;t count toward the plan.
        </Small>
        {preview && <SEmbedsPagePreview src={preview} title="Embed preview" />}
      </Modal>
    </Flex>
  );
};

export default EmbedsPage;
