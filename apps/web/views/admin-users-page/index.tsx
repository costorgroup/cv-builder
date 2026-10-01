"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Chip,
  DataTable,
  Flex,
  NativeSelect,
  Skeleton,
  Small,
  Strong,
  type TDataTableColumn,
} from "@costor/ui";
import {
  adminApi,
  type TAdminUser,
  type TAdminUserList,
  type TAdminUserQuery,
} from "@/utils/admin-api";
import { adminUserPath } from "@/utils/admin-path";
import { ApiError } from "@/utils/api-client";
import WideTable from "@/components/wide-table";
import {
  SAdminUsersPageFilters,
  SAdminUsersPageLink,
  SAdminUsersPageSelect,
} from "@/views/admin-users-page/styles";

/** How long typing pauses before the search reaches the server. */
const SEARCH_DELAY_MS = 300;
/** The newest this many matches are loaded; the table pages through them. */
const LOADED_USERS = 500;
const PAGE_SIZE = 25;

const shortDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const dateOrNever = (iso: string | null) =>
  iso ? shortDate.format(new Date(iso)) : "Never";

const ROLE_LABELS = {
  USER: "User",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
};

/**
 * A user as the table shows it. The table searches the text of each column,
 * so every column's key holds what it displays.
 */
type TUserRow = TAdminUser & {
  user: string;
  plan: string;
  state: string;
  joined: string;
  lastActive: string;
};

const toRow = (user: TAdminUser): TUserRow => ({
  ...user,
  user: `${user.firstName} ${user.lastName} ${user.email}`,
  plan: user.subscription?.plan.name ?? "—",
  state: [
    user.role !== "USER" && ROLE_LABELS[user.role],
    user.disabledAt ? "Disabled" : "Active",
  ]
    .filter(Boolean)
    .join(" "),
  joined: shortDate.format(new Date(user.createdAt)),
  lastActive: dateOrNever(user.lastActiveAt),
});

const COLUMNS: TDataTableColumn<TUserRow>[] = [
  {
    id: "user",
    key: "user",
    name: "User",
    renderCell: ({ row }) => (
      <SAdminUsersPageLink href={adminUserPath(row.id)}>
        <Strong>
          {row.firstName} {row.lastName}
        </Strong>
        <Small color="secondary">{row.email}</Small>
      </SAdminUsersPageLink>
    ),
  },
  {
    id: "plan",
    key: "plan",
    name: "Plan",
    renderCell: ({ row }) => (
      <>
        {row.plan}
        {row.subscription && row.subscription.provider !== "none" && (
          <Small color="secondary">
            {" "}
            · {row.subscription.status.toLowerCase()}
          </Small>
        )}
      </>
    ),
  },
  { id: "cvs", key: "cvCount", name: "CVs" },
  {
    id: "state",
    key: "state",
    name: "Status",
    renderCell: ({ row }) => (
      <Flex gap={1} wrap="wrap">
        {row.role !== "USER" && (
          <Chip radius="pill" size="xs" variant="subtle" color="primary">
            {ROLE_LABELS[row.role]}
          </Chip>
        )}
        {row.disabledAt ? (
          <Chip radius="pill" size="xs" variant="subtle" color="error">
            Disabled
          </Chip>
        ) : (
          <Chip radius="pill" size="xs" variant="subtle" color="success">
            Active
          </Chip>
        )}
      </Flex>
    ),
  },
  { id: "joined", key: "joined", name: "Joined" },
  { id: "last-active", key: "lastActive", name: "Last active" },
];

/** Every account, searchable by email or name, with its plan and status. */
const AdminUsersPage = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState<TAdminUserQuery>({
    page: 1,
    pageSize: LOADED_USERS,
  });
  const [result, setResult] = useState<TAdminUserList | { error: string }>();

  // The table filters what's loaded at once; the server search catches
  // matches beyond the loaded users once typing pauses.
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setQuery((current) =>
          current.search === search.trim()
            ? current
            : { ...current, search: search.trim() },
        ),
      SEARCH_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    adminApi
      .users(query, controller.signal)
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
  }, [query]);

  const filter = (change: Pick<TAdminUserQuery, "status" | "role">) => {
    setQuery((current) => ({ ...current, ...change }));
    setPage(1);
  };

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
          data={result.items.map(toRow)}
          size="sm"
          radius="lg"
          pageSize={PAGE_SIZE}
          title="Users"
          description="Every account, newest first, with its plan and status."
          searchPlaceholder="Search by email or name"
          search={search}
          onSearchChange={setSearch}
          page={page}
          onPageChange={setPage}
        />
      </WideTable>
    );
  };

  return (
    <Flex direction="column" gap={4}>
      <SAdminUsersPageFilters gap={3} wrap="wrap" align="center">
        <SAdminUsersPageSelect>
          <NativeSelect
            aria-label="Status"
            size="sm"
            variant="subtle"
            value={query.status ?? ""}
            options={[
              { value: "", label: "Any status" },
              { value: "active", label: "Active" },
              { value: "disabled", label: "Disabled" },
            ]}
            onChange={(_, value) =>
              filter({
                status: (value || undefined) as TAdminUserQuery["status"],
              })
            }
          />
        </SAdminUsersPageSelect>
        <SAdminUsersPageSelect>
          <NativeSelect
            aria-label="Role"
            size="sm"
            variant="subtle"
            value={query.role ?? ""}
            options={[
              { value: "", label: "Any role" },
              ...Object.entries(ROLE_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
            onChange={(_, value) =>
              filter({ role: (value || undefined) as TAdminUserQuery["role"] })
            }
          />
        </SAdminUsersPageSelect>
      </SAdminUsersPageFilters>

      {result && !("error" in result) && result.total > result.items.length && (
        <Small color="secondary">
          Only the newest {result.items.length} matches are loaded. Search or
          filter to find the others.
        </Small>
      )}
      {renderTable()}
    </Flex>
  );
};

export default AdminUsersPage;
