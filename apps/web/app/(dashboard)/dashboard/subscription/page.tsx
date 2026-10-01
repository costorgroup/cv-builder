import type { TPlanPeriod } from "@repo/cv-core";
import { SubscriptionPage } from "@/views";
import { getSearchParam, type TSearchParams } from "@/utils/search-param";

const PERIODS: TPlanPeriod[] = ["MONTHLY", "QUARTERLY", "YEARLY"];

export default async ({ searchParams }: { searchParams: TSearchParams }) => {
  const period = (await getSearchParam(searchParams, "period"))?.toUpperCase();
  // Paddle links here with the checkout to finish (the default payment link).
  const pendingCheckoutId = await getSearchParam(searchParams, "_ptxn");
  return (
    <SubscriptionPage
      initialPeriod={PERIODS.find((each) => each === period)}
      pendingCheckoutId={pendingCheckoutId}
    />
  );
};
