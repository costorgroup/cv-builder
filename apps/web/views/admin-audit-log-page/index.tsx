"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  DataTable,
  Flex,
  NativeSelect,
  Skeleton,
  Small,
  type TDataTableColumn,
} from "@costor/ui";
import { AUDIT_ACTIONS } from "@repo/cv-core";
import WideTable from "@/components/wide-table";
import {
  adminBillingApi,
  type TAuditLogEntry,
  type TAuditLogPage,
} from "@/utils/admin-api";
import { adminUserPath } from "@/utils/admin-path";
import { ApiError } from "@/utils/api-client";
import {
  SAdminUsersPageFilters,
  SAdminUsersPageLink,
} from "@/views/admin-users-page/styles";
import { SAdminAuditLogPageAction } from "@/views/admin-audit-log-page/styles";

/** The newest this many entries are loaded; the table pages through them. */
const LOADED_ENTRIES = 500;
const PAGE_SIZE = 25;

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "medium",
});

/** "CV_DELETED" → "CV deleted". */
const actionLabel = (action: string) =>
  (
    action.charAt(0) + action.slice(1).toLowerCase().replaceAll("_", " ")
  ).replace(/^Cv(?= )/, "CV");

/**
 * An entry as the table shows it. The table searches the text of each
 * column, so every column's key holds what it displays.
 */
type TEntryRow = TAuditLogEntry & {
  when: string;
  what: string;
  who: string;
  about: string;
  from: string;
  /** Account id → email, for links. */
  emails: Record<string, string>;
};

const personText = (id: string | null, emails: Record<string, string>) =>
  id ? (emails[id] ?? "Deleted account") : "—";

const toRow =
  (emails: Record<string, string>) =>
  (entry: TAuditLogEntry): TEntryRow => ({
    ...entry,
    emails,
    when: dateTime.format(new Date(entry.createdAt)),
    what: actionLabel(entry.action),
    who:
      entry.actorType === "SYSTEM"
        ? `System (${entry.actorId ?? "—"})`
        : personText(entry.actorId, emails),
    about:
      entry.resourceType === "user"
        ? personText(entry.resourceId, emails)
        : `${entry.resourceType}${entry.resourceId ? ` ${entry.resourceId.slice(0, 8)}…` : ""}`,
    from: entry.ipAddress ?? "—",
  });

const Person = ({
  id,
  emails,
  text,
}: {
  id: string | null;
  emails: Record<string, string>;
  text: string;
}) =>
  id && emails[id] ? (
    <SAdminUsersPageLink href={adminUserPath(id)}>{text}</SAdminUsersPageLink>
  ) : (
    <Small color="secondary">{text}</Small>
  );

const COLUMNS: TDataTableColumn<TEntryRow>[] = [
  { id: "when", key: "when", name: "When" },
  { id: "what", key: "what", name: "What" },
  {
    id: "who",
    key: "who",
    name: "Who",
    renderCell: ({ row }) =>
      row.actorType === "SYSTEM" ? (
        row.who
      ) : (
        <Person id={row.actorId} emails={row.emails} text={row.who} />
      ),
  },
  {
    id: "about",
    key: "about",
    name: "About",
    renderCell: ({ row }) =>
      row.resourceType === "user" ? (
        <Person id={row.resourceId} emails={row.emails} text={row.about} />
      ) : (
        row.about
      ),
  },
  { id: "from", key: "from", name: "From" },
];

/** Everything the audit log recorded, newest first, filterable by action. */
const AdminAuditLogPage = () => {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<TAuditLogPage | { error: string }>();

  useEffect(() => {
    const controller = new AbortController();
    adminBillingApi
      .auditLogs(
        { action, page: 1, pageSize: LOADED_ENTRIES },
        controller.signal,
      )
      .then(setResult, (error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          error:
            error instanceof ApiError
              ? error.message
              : "Couldn't reach the server. Try again.",
        });
      });
    return () => controller.abort();
  }, [action]);

  const renderTable = () => {
    if (!result) {
      return <Skeleton width="100%" height={420} radius="lg" aria-busy />;
    }
    if ("error" in result) {
      return (
        <Alert color="error" variant="subtle">
          {result.error}
        </Alert>
      );
    }
    return (
      <WideTable minWidth={820}>
        <DataTable
          columns={COLUMNS}
          data={result.items.map(toRow(result.emails))}
          size="sm"
          radius="lg"
          pageSize={PAGE_SIZE}
          title="Audit log"
          description="Important actions, newest first: who did what, to what, and from where."
          searchPlaceholder="Search by action, person or IP"
          page={page}
          onPageChange={setPage}
        />
      </WideTable>
    );
  };

  return (
    <Flex direction="column" gap={4}>
      <SAdminUsersPageFilters gap={3} wrap="wrap" align="center">
        <SAdminAuditLogPageAction>
          <NativeSelect
            aria-label="Action"
            size="sm"
            variant="subtle"
            value={action}
            options={[
              { value: "", label: "Every action" },
              ...AUDIT_ACTIONS.map((value) => ({
                value,
                label: actionLabel(value),
              })),
            ]}
            onChange={(_, value) => {
              setAction(value);
              setPage(1);
            }}
          />
        </SAdminAuditLogPageAction>
      </SAdminUsersPageFilters>

      {result && !("error" in result) && result.total > result.items.length && (
        <Small color="secondary">
          Only the newest {result.items.length} entries are loaded. Filter by
          action to see older ones.
        </Small>
      )}
      {renderTable()}
    </Flex>
  );
};

export default AdminAuditLogPage;
