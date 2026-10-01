"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  DataTable,
  Flex,
  Skeleton,
  Small,
  type TDataTableColumn,
} from "@costor/ui";
import { adminBillingApi, type TAdminUsage } from "@/utils/admin-api";
import { adminUserPath } from "@/utils/admin-path";
import { ApiError } from "@/utils/api-client";
import { formatBytes } from "@/utils/format-bytes";
import { SAdminUsersPageLink } from "@/views/admin-users-page/styles";
import { SAdminUsagePageTables } from "@/views/admin-usage-page/styles";

const monthName = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const count = new Intl.NumberFormat("en-US");

type TMonthRow = {
  id: string;
  month: string;
  signups: string;
  cvsCreated: string;
  pdfsGenerated: string;
};

type TAccountRow = {
  id: string;
  userId: string | null;
  account: string;
  amount: string;
};

const MONTH_COLUMNS: TDataTableColumn<TMonthRow>[] = [
  { id: "month", key: "month", name: "Month" },
  { id: "signups", key: "signups", name: "Sign-ups" },
  { id: "cvs", key: "cvsCreated", name: "CVs created" },
  { id: "pdfs", key: "pdfsGenerated", name: "PDFs made" },
];

const accountColumns = (
  amountName: string,
): TDataTableColumn<TAccountRow>[] => [
  {
    id: "account",
    key: "account",
    name: "Account",
    renderCell: ({ row }) =>
      row.userId ? (
        <SAdminUsersPageLink href={adminUserPath(row.userId)}>
          {row.account}
        </SAdminUsersPageLink>
      ) : (
        <Small color="secondary">{row.account}</Small>
      ),
  },
  { id: "amount", key: "amount", name: amountName },
];

const toAccountRows = (
  rows: { userId: string | null; email: string | null }[],
  amountOf: (index: number) => string,
): TAccountRow[] =>
  rows.map((row, index) => ({
    id: row.userId ?? `deleted-${index}`,
    userId: row.userId && row.email ? row.userId : null,
    account: row.userId && row.email ? row.email : "Deleted account",
    amount: amountOf(index),
  }));

/** Sign-ups, CVs and PDFs month by month, and the heaviest accounts. */
const AdminUsagePage = () => {
  const [usage, setUsage] = useState<TAdminUsage | { error: string }>();

  useEffect(() => {
    adminBillingApi.usage().then(setUsage, (error: unknown) =>
      setUsage({
        error:
          error instanceof ApiError
            ? error.message
            : "Couldn't reach the server. Try again.",
      }),
    );
  }, []);

  if (!usage)
    return <Skeleton width="100%" height={360} radius="lg" aria-busy />;
  if ("error" in usage) {
    return (
      <Alert color="error" variant="subtle">
        {usage.error}
      </Alert>
    );
  }

  // Newest month first.
  const months: TMonthRow[] = usage.months
    .map((month, index) => ({
      id: month,
      month: monthName.format(new Date(`${month}-01T00:00:00Z`)),
      signups: count.format(usage.signups[index] ?? 0),
      cvsCreated: count.format(usage.cvsCreated[index] ?? 0),
      pdfsGenerated: count.format(usage.pdfsGenerated[index] ?? 0),
    }))
    .reverse();

  return (
    <Flex direction="column" gap={5}>
      <DataTable
        columns={MONTH_COLUMNS}
        data={months}
        size="sm"
        radius="lg"
        title="By month"
        description="Sign-ups, CVs created and PDFs made over the last six months, newest first."
        searchPlaceholder="Search by month"
      />
      <SAdminUsagePageTables>
        <DataTable
          columns={accountColumns("CVs")}
          data={toAccountRows(usage.mostCvs, (index) =>
            count.format(usage.mostCvs[index]?.cvs ?? 0),
          )}
          size="sm"
          radius="lg"
          title="Most CVs"
          description="The accounts with the most saved CVs."
          searchPlaceholder="Search by email"
        />
        <DataTable
          columns={accountColumns("Storage")}
          data={toAccountRows(usage.mostStorage, (index) =>
            formatBytes(usage.mostStorage[index]?.bytes ?? 0),
          )}
          size="sm"
          radius="lg"
          title="Most storage"
          description="The accounts whose CVs take up the most space."
          searchPlaceholder="Search by email"
        />
      </SAdminUsagePageTables>
    </Flex>
  );
};

export default AdminUsagePage;
