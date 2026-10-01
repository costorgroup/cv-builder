import type { TPlanPeriod } from "@repo/cv-core";
import { SubscriptionPage } from "@/views";
import { getSearchParam, type TSearchParams } from "@/utils/search-param";

const PERIODS: TPlanPeriod[] = ["MONTHLY", "QUARTERLY", "YEARLY"];

/** The team's plan: the same page as the user's own, for the team. */
export default async ({ searchParams }: { searchParams: TSearchParams }) => {
  const period = (await getSearchParam(searchParams, "period"))?.toUpperCase();
  return (
    <SubscriptionPage initialPeriod={PERIODS.find((each) => each === period)} />
  );
};
