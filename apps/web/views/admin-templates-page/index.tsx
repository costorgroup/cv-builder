"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
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
import { defaultTemplateSpec } from "@repo/cv-core";
import TemplatePreview from "@/components/template-preview";
import WideTable from "@/components/wide-table";
import { useAuth } from "@/providers/auth-provider";
import { templates as codeTemplates } from "@/templates";
import {
  adminTemplatesApi,
  type TAdminTemplate,
  type TAdminTemplateChange,
} from "@/utils/admin-api";
import { ApiError } from "@/utils/api-client";
import { forgetTemplateCatalog } from "@/utils/template-catalog";
import {
  SAdminTemplatesPageField,
  SAdminTemplatesPageName,
  SAdminTemplatesPageThumbnail,
} from "@/views/admin-templates-page/styles";

const messageOf = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Couldn't reach the server. Try again.";

const TIER_OPTIONS = [
  { value: "FREE", label: "Every plan" },
  { value: "PREMIUM", label: "Premium" },
];
const STATUS_OPTIONS = [
  { value: "PUBLISHED", label: "Published" },
  { value: "HIDDEN", label: "Hidden" },
];

type TDraft = Pick<TAdminTemplate, "tier" | "status"> & {
  category: string;
  sortOrder: string;
};

const draftOf = (template: TAdminTemplate): TDraft => ({
  tier: template.tier,
  status: template.status,
  category: template.category ?? "",
  sortOrder: String(template.sortOrder),
});

/** What changed from the saved template; empty if nothing did. */
const changesOf = (
  template: TAdminTemplate,
  draft: TDraft,
): TAdminTemplateChange => {
  const saved = draftOf(template);
  const change: TAdminTemplateChange = {};
  if (draft.tier !== saved.tier) change.tier = draft.tier;
  if (draft.status !== saved.status) change.status = draft.status;
  if (draft.category.trim() !== saved.category) {
    change.category = draft.category.trim();
  }
  if (draft.sortOrder !== saved.sortOrder) {
    change.sortOrder = Number(draft.sortOrder) || 0;
  }
  return change;
};

/**
 * Which templates are offered, to whom, and in what order. Their look is in
 * code; this decides how they're offered. Super admins edit; admins look.
 */
const AdminTemplatesPage = () => {
  const auth = useAuth();
  const canEdit =
    auth.status === "signed-in" && auth.user.role === "SUPER_ADMIN";
  const [result, setResult] = useState<TAdminTemplate[] | { error: string }>();
  const [drafts, setDrafts] = useState<Record<string, TDraft>>({});
  const [saving, setSaving] = useState<string>();
  const [notice, setNotice] = useState<
    { success: string } | { error: string }
  >();

  const load = useCallback(
    () =>
      adminTemplatesApi.list().then(
        (templates) => {
          setResult(templates);
          setDrafts(
            Object.fromEntries(
              templates.map((each) => [each.id, draftOf(each)]),
            ),
          );
        },
        (error: unknown) => setResult({ error: messageOf(error) }),
      ),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  if (!result) {
    return <Skeleton width="100%" height={480} radius="lg" aria-busy />;
  }
  if ("error" in result) {
    return (
      <Alert color="error" variant="subtle">
        {result.error}
      </Alert>
    );
  }

  const setDraft = (id: string, change: Partial<TDraft>) =>
    setDrafts((current) => {
      const draft = current[id];
      return draft ? { ...current, [id]: { ...draft, ...change } } : current;
    });

  const onSave = async (template: TAdminTemplate) => {
    const draft = drafts[template.id];
    if (!draft) return;
    const change = changesOf(template, draft);
    setSaving(template.id);
    setNotice(undefined);
    try {
      await adminTemplatesApi.update(template.id, change);
      forgetTemplateCatalog();
      await load();
      setNotice({
        success: `${template.name} saved. The site and editor show it within a minute.`,
      });
    } catch (error) {
      setNotice({ error: messageOf(error) });
    } finally {
      setSaving(undefined);
    }
  };

  const isDefault = (id: string) => id === defaultTemplateSpec.id;

  const columns: TDataTableColumn<TAdminTemplate>[] = [
    {
      id: "name",
      key: "name",
      name: "Template",
      renderCell: ({ row }) => {
        const code = codeTemplates.find(({ id }) => id === row.id);
        return (
          <SAdminTemplatesPageName>
            {code && (
              <SAdminTemplatesPageThumbnail>
                <TemplatePreview template={code} />
              </SAdminTemplatesPageThumbnail>
            )}
            <Flex direction="column">
              <Strong>{row.name}</Strong>
              <Small color="secondary">{row.id}</Small>
            </Flex>
          </SAdminTemplatesPageName>
        );
      },
    },
    {
      id: "category",
      key: "category",
      name: "Category",
      renderCell: ({ row }) =>
        canEdit ? (
          <SAdminTemplatesPageField width={150}>
            <TextField
              aria-label={`${row.name} category`}
              size="sm"
              variant="subtle"
              maxLength={40}
              placeholder="None"
              value={drafts[row.id]?.category ?? ""}
              onChange={(event) =>
                setDraft(row.id, { category: event.target.value })
              }
            />
          </SAdminTemplatesPageField>
        ) : (
          (row.category ?? "—")
        ),
    },
    {
      id: "tier",
      key: "tier",
      name: "Included in",
      renderCell: ({ row }) =>
        canEdit ? (
          <SAdminTemplatesPageField width={140}>
            <NativeSelect
              aria-label={`${row.name} included in`}
              size="sm"
              variant="subtle"
              disabled={isDefault(row.id)}
              value={drafts[row.id]?.tier ?? row.tier}
              options={TIER_OPTIONS}
              onChange={(_, value) =>
                setDraft(row.id, { tier: value as TDraft["tier"] })
              }
            />
          </SAdminTemplatesPageField>
        ) : (
          <Chip
            radius="pill"
            size="xs"
            variant="subtle"
            color={row.tier === "FREE" ? "success" : "primary"}
          >
            {row.tier === "FREE" ? "Every plan" : "Premium"}
          </Chip>
        ),
    },
    {
      id: "status",
      key: "status",
      name: "Status",
      renderCell: ({ row }) =>
        canEdit ? (
          <SAdminTemplatesPageField width={140}>
            <NativeSelect
              aria-label={`${row.name} status`}
              size="sm"
              variant="subtle"
              disabled={isDefault(row.id)}
              value={drafts[row.id]?.status ?? row.status}
              options={STATUS_OPTIONS}
              onChange={(_, value) =>
                setDraft(row.id, { status: value as TDraft["status"] })
              }
            />
          </SAdminTemplatesPageField>
        ) : (
          <Chip
            radius="pill"
            size="xs"
            variant="subtle"
            color={row.status === "PUBLISHED" ? "success" : "default"}
          >
            {row.status === "PUBLISHED" ? "Published" : "Hidden"}
          </Chip>
        ),
    },
    {
      id: "order",
      key: "sortOrder",
      name: "Order",
      renderCell: ({ row }) =>
        canEdit ? (
          <SAdminTemplatesPageField width={90}>
            <TextField
              aria-label={`${row.name} order`}
              type="number"
              size="sm"
              variant="subtle"
              value={drafts[row.id]?.sortOrder ?? ""}
              onChange={(event) =>
                setDraft(row.id, { sortOrder: event.target.value })
              }
            />
          </SAdminTemplatesPageField>
        ) : (
          row.sortOrder
        ),
    },
    { id: "cvs", key: "cvs", name: "CVs" },
    ...(canEdit
      ? [
          {
            id: "save",
            key: "id",
            name: "",
            renderCell: ({ row }) => {
              const draft = drafts[row.id];
              const dirty =
                !!draft && Object.keys(changesOf(row, draft)).length > 0;
              return (
                <Button
                  size="sm"
                  variant={dirty ? "solid" : "subtle"}
                  color={dirty ? "primary" : "default"}
                  disabled={!dirty || !!saving}
                  onClick={() => onSave(row)}
                >
                  {saving === row.id ? "Saving…" : "Save"}
                </Button>
              );
            },
          } satisfies TDataTableColumn<TAdminTemplate>,
        ]
      : []),
  ];

  return (
    <Flex direction="column" gap={4}>
      {notice && (
        <Alert
          color={"error" in notice ? "error" : "success"}
          variant="subtle"
          onClose={() => setNotice(undefined)}
        >
          {"error" in notice ? notice.error : notice.success}
        </Alert>
      )}
      <WideTable minWidth={900}>
        <DataTable
          columns={columns}
          data={result}
          size="sm"
          radius="lg"
          pageSize={25}
          title="Templates"
          description={`Which templates are offered, and on which plans. Hidden ones can't be picked for a CV; CVs already on one keep it. New CVs start on ${defaultTemplateSpec.name}, so it stays published and on every plan.`}
          searchPlaceholder="Search by name or category"
        />
      </WideTable>
    </Flex>
  );
};

export default AdminTemplatesPage;
