"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  CheckBox,
  Chip,
  DataTable,
  Flex,
  NativeSelect,
  Skeleton,
  Small,
  type TDataTableColumn,
} from "@costor/ui";
import WideTable from "@/components/wide-table";
import {
  adminBillingApi,
  type TAdminPlan,
  type TAdminSubscription,
} from "@/utils/admin-api";
import { adminUserPath } from "@/utils/admin-path";
import { ApiError } from "@/utils/api-client";
import { formatMoney } from "@/utils/pricing";
import {
  SAdminUsersPageFilters,
  SAdminUsersPageLink,
  SAdminUsersPageSelect,
} from "@/views/admin-users-page/styles";

/** The newest this many matches are loaded; the table pages through them. */
const LOADED_SUBSCRIPTIONS = 500;
const PAGE_SIZE = 25;

const STATUSES = ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED", "EXPIRED"];
const STATUS_COLORS: Record<
  string,
  "success" | "warning" | "error" | "default"
> = {
  ACTIVE: "success",
  TRIALING: "success",
  PAST_DUE: "warning",
  CANCELED: "default",
  EXPIRED: "error",
};

const shortDate = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const statusLabel = (status: string) => status.toLowerCase().replace("_", " ");

type TResult =
  { items: TAdminSubscription[]; total: number } | { error: string };

/**
 * A subscription as the table shows it. The table searches the text of each
 * column, so every column's key holds what it displays.
 */
type TSubscriptionRow = TAdminSubscription & {
  account: string;
  planName: string;
  priceText: string;
  statusText: string;
  renews: string;
  payments: string;
};

const toRow = (subscription: TAdminSubscription): TSubscriptionRow => ({
  ...subscription,
  account:
    subscription.organization.personalOwner?.email ??
    subscription.organization.name,
  planName: subscription.plan.name,
  priceText: subscription.price
    ? `${formatMoney(subscription.price.amountCents / 100, subscription.price.currency)} / ${subscription.price.period.toLowerCase()}`
    : "—",
  statusText: statusLabel(subscription.status),
  renews: subscription.currentPeriodEnd
    ? shortDate.format(new Date(subscription.currentPeriodEnd))
    : "—",
  payments:
    subscription.provider === "none"
      ? "Not paying"
      : `${subscription.provider} · ${subscription.providerSubscriptionId ?? "—"}`,
});

const COLUMNS: TDataTableColumn<TSubscriptionRow>[] = [
  {
    id: "account",
    key: "account",
    name: "Account",
    renderCell: ({ row }) => {
      const owner = row.organization.personalOwner;
      return owner ? (
        <SAdminUsersPageLink href={adminUserPath(owner.id)}>
          {owner.email}
        </SAdminUsersPageLink>
      ) : (
        row.account
      );
    },
  },
  {
    id: "plan",
    key: "planName",
    name: "Plan",
    renderCell: ({ row }) => (
      <Flex align="center" gap={1} wrap="wrap">
        {row.planName}
        {row.overrides && (
          <Chip radius="pill" size="xs" variant="subtle" color="primary">
            + extras
          </Chip>
        )}
      </Flex>
    ),
  },
  { id: "price", key: "priceText", name: "Price" },
  {
    id: "status",
    key: "statusText",
    name: "Status",
    renderCell: ({ row }) => (
      <>
        <Chip
          radius="pill"
          size="xs"
          variant="subtle"
          color={STATUS_COLORS[row.status] ?? "default"}
        >
          {row.statusText}
        </Chip>
        {row.cancelAtPeriodEnd && (
          <Small color="secondary"> · set to end</Small>
        )}
      </>
    ),
  },
  { id: "renews", key: "renews", name: "Renews / ends" },
  { id: "payments", key: "payments", name: "Payments" },
];

/** Every account's subscription, filterable by status, plan and paying. */
const AdminSubscriptionsPage = () => {
  const [status, setStatus] = useState("");
  const [planKey, setPlanKey] = useState("");
  const [paid, setPaid] = useState(true);
  const [page, setPage] = useState(1);
  const [plans, setPlans] = useState<TAdminPlan[]>([]);
  const [result, setResult] = useState<TResult>();

  useEffect(() => {
    adminBillingApi.plans().then(setPlans, () => setPlans([]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    adminBillingApi
      .subscriptions(
        {
          status,
          planKey,
          paid: paid || undefined,
          page: 1,
          pageSize: LOADED_SUBSCRIPTIONS,
        },
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
  }, [status, planKey, paid]);

  const filter =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
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
      <WideTable minWidth={900}>
        <DataTable
          columns={COLUMNS}
          data={result.items.map(toRow)}
          size="sm"
          radius="lg"
          pageSize={PAGE_SIZE}
          title="Subscriptions"
          description="Every account's plan, what it pays and when it renews. Recently changed first."
          searchPlaceholder="Search by email, plan or status"
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
            value={status}
            options={[
              { value: "", label: "Any status" },
              ...STATUSES.map((value) => ({
                value,
                label:
                  value.charAt(0) +
                  value.slice(1).toLowerCase().replace("_", " "),
              })),
            ]}
            onChange={(_, value) => filter(setStatus)(value)}
          />
        </SAdminUsersPageSelect>
        <SAdminUsersPageSelect>
          <NativeSelect
            aria-label="Plan"
            size="sm"
            variant="subtle"
            value={planKey}
            options={[
              { value: "", label: "Any plan" },
              ...plans.map(({ key, name }) => ({ value: key, label: name })),
            ]}
            onChange={(_, value) => filter(setPlanKey)(value)}
          />
        </SAdminUsersPageSelect>
        <CheckBox
          size="sm"
          label="Paying only"
          checked={paid}
          onChange={(event) => filter(setPaid)(event.target.checked)}
        />
      </SAdminUsersPageFilters>

      {result && !("error" in result) && result.total > result.items.length && (
        <Small color="secondary">
          Only the {result.items.length} most recently changed are loaded.
          Filter to find the others.
        </Small>
      )}
      {renderTable()}
    </Flex>
  );
};

export default AdminSubscriptionsPage;
