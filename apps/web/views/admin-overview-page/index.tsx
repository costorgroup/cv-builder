"use client";

import { useEffect, useState } from "react";
import { Alert, Heading, Skeleton, Small } from "@costor/ui";
import { adminApi, type TAdminStats } from "@/utils/admin-api";
import { ApiError } from "@/utils/api-client";
import { formatBytes } from "@/utils/format-bytes";
import { formatMoney } from "@/utils/pricing";
import {
  SAdminOverviewPage,
  SAdminOverviewPageStat,
} from "@/views/admin-overview-page/styles";

const count = new Intl.NumberFormat("en-US");

const Stat = ({
  label,
  value,
  details,
}: {
  label: string;
  value: string;
  details: string[];
}) => (
  <SAdminOverviewPageStat radius="lg">
    <Small color="secondary">{label}</Small>
    <Heading as="h4">{value}</Heading>
    {details.map((detail) => (
      <Small key={detail} color="secondary">
        {detail}
      </Small>
    ))}
  </SAdminOverviewPageStat>
);

/** Platform totals: users, CVs, paid plans and revenue, usage. */
const AdminOverviewPage = () => {
  const [stats, setStats] = useState<TAdminStats | { error: string }>();

  useEffect(() => {
    adminApi.stats().then(setStats, (error: unknown) =>
      setStats({
        error:
          error instanceof ApiError
            ? error.message
            : "Couldn't reach the server. Try again.",
      }),
    );
  }, []);

  if (!stats) {
    return (
      <SAdminOverviewPage aria-busy>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} width="100%" height={150} radius="lg" />
        ))}
      </SAdminOverviewPage>
    );
  }
  if ("error" in stats) {
    return (
      <Alert color="error" variant="subtle">
        {stats.error}
      </Alert>
    );
  }

  const revenue = Object.entries(stats.estimatedMonthlyRevenue);
  return (
    <SAdminOverviewPage>
      <Stat
        label="Users"
        value={count.format(stats.users.total)}
        details={[
          `${count.format(stats.users.activeLast30Days)} active in the last 30 days`,
          `${count.format(stats.users.newThisMonth)} new this month`,
          `${count.format(stats.users.disabled)} disabled`,
        ]}
      />
      <Stat
        label="CVs"
        value={count.format(stats.cvs.total)}
        details={[`${count.format(stats.cvs.newThisMonth)} created this month`]}
      />
      <Stat
        label="Paid subscriptions"
        value={count.format(stats.subscriptions.paid)}
        details={[
          ...Object.entries(stats.subscriptions.byPlan).map(
            ([plan, total]) => `${plan}: ${count.format(total)}`,
          ),
          `${count.format(stats.subscriptions.pastDue)} with a failed payment`,
          `${count.format(stats.subscriptions.endingAtPeriodEnd)} set to end`,
        ]}
      />
      <Stat
        label="Estimated monthly revenue"
        value={
          revenue.length === 0
            ? "—"
            : revenue
                .map(([currency, cents]) => formatMoney(cents / 100, currency))
                .join(" + ")
        }
        details={["From active paid plans, before tax and payment fees"]}
      />
      <Stat
        label="PDFs this month"
        value={count.format(stats.pdfsThisMonth)}
        details={[]}
      />
      <Stat
        label="Storage"
        value={formatBytes(stats.storageBytes)}
        details={["CV content, including photos"]}
      />
    </SAdminOverviewPage>
  );
};

export default AdminOverviewPage;
