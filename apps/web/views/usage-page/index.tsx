"use client";

import { Alert, Button, Flex, Skeleton } from "@costor/ui";
import ButtonLink from "@/components/button-link";
import SettingsCard from "@/components/settings-card";
import UsageMeter from "@/components/usage-meter";
import { useEntitlements } from "@/providers/entitlements-provider";
import { formatBytes } from "@/utils/format-bytes";
import { PRICING_PATH } from "@/utils/site";
import { SUsagePage } from "@/views/usage-page/styles";

const longDate = new Intl.DateTimeFormat(undefined, { dateStyle: "long" });

/** The first day of next month (UTC), when monthly counts start over. */
const nextMonthStart = (now = new Date()) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

/**
 * How much of the plan's limits is used. Figures come from the API, which
 * counts them itself; limits the plan doesn't include aren't shown.
 */
const UsagePage = () => {
  const entitlements = useEntitlements();

  if (entitlements.status === "loading") {
    return <Skeleton width="100%" height={320} radius="lg" aria-busy />;
  }
  if (entitlements.status === "error") {
    return (
      <Alert color="error" variant="subtle">
        Couldn&apos;t load your usage. Try again in a moment.
      </Alert>
    );
  }

  const { overview } = entitlements;
  const { cvs, storageBytes, pdfsThisMonth } = overview.usage;
  // A limit of 0 means the plan doesn't include it at all.
  const shown = (max: number | null) => max !== 0;

  return (
    <SUsagePage direction="column" gap={5}>
      <SettingsCard
        title={`${overview.plan.name} plan`}
        description="What you've used of your plan's limits."
        actions={
          <Button as={ButtonLink} href={PRICING_PATH}>
            Compare plans
          </Button>
        }
      >
        <Flex direction="column" gap={6}>
          {shown(cvs.max) && (
            <UsageMeter
              label="Saved CVs"
              usage={cvs}
              detail={
                cvs.max !== null && cvs.used > cvs.max
                  ? "You have more CVs than your plan allows. They're all still yours; delete some or upgrade to create new ones."
                  : undefined
              }
            />
          )}
          {shown(storageBytes.max) && (
            <UsageMeter
              label="Storage"
              usage={storageBytes}
              format={formatBytes}
              detail="Your CVs' content, including photos."
            />
          )}
          {shown(pdfsThisMonth.max) && (
            <UsageMeter
              label="PDFs this month"
              usage={pdfsThisMonth}
              detail={`Starts over on ${longDate.format(nextMonthStart())}.`}
            />
          )}
        </Flex>
      </SettingsCard>
    </SUsagePage>
  );
};

export default UsagePage;
