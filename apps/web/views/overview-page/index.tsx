"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Flex,
  Heading,
  LinearProgress,
  Skeleton,
  Small,
  Strong,
} from "@costor/ui";
import ButtonLink from "@/components/button-link";
import CvCard, { CvCardSkeleton } from "@/components/cv-card";
import UpgradePrompt from "@/components/upgrade-prompt";
import { useAuth } from "@/providers/auth-provider";
import { useEntitlements } from "@/providers/entitlements-provider";
import { cvEditorStepPath } from "@/utils/cv-editor";
import { cvsApi, type TSavedCv } from "@/utils/cvs-api";
import { MY_CVS_PATH } from "@/utils/dashboard-path";
import { formatBytes } from "@/utils/format-bytes";
import { PRICING_PATH } from "@/utils/site";
import { subscriptionStatusText } from "@/utils/subscription-status";
import {
  SOverviewPage,
  SOverviewPageRecent,
  SOverviewPageSectionHeader,
  SOverviewPageStat,
  SOverviewPageStatAction,
  SOverviewPageStats,
} from "@/views/overview-page/styles";
import type { TOverviewPageStatProps } from "@/views/overview-page/types";

const RECENT_COUNT = 6;

const greeting = (hour: number) =>
  hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

const OverviewPageStat = ({
  label,
  value,
  detail,
  usage,
  action,
}: TOverviewPageStatProps) => (
  <SOverviewPageStat radius="lg">
    <Small color="secondary">{label}</Small>
    <Heading as="h5">{value}</Heading>
    {usage && usage.max !== null && (
      <LinearProgress
        value={Math.min(usage.used, usage.max)}
        max={Math.max(usage.max, 1)}
        color={usage.used >= usage.max ? "warning" : "primary"}
        variant="subtle"
      />
    )}
    {detail && <Small color="secondary">{detail}</Small>}
    {action && <SOverviewPageStatAction>{action}</SOverviewPageStatAction>}
  </SOverviewPageStat>
);

/** "3 / 5", or just "3" when there's no limit. */
const usedOf = (
  used: number,
  max: number | null,
  format: (value: number) => string = String,
) => (max === null ? format(used) : `${format(used)} / ${format(max)}`);

/**
 * Where the dashboard opens: the plan and how much of it is used, and the
 * latest CVs.
 */
const OverviewPage = () => {
  const auth = useAuth();
  const entitlements = useEntitlements();
  const [recent, setRecent] = useState<TSavedCv[] | "error">();
  const signedIn = auth.status === "signed-in";

  useEffect(() => {
    if (!signedIn) return;
    const controller = new AbortController();
    cvsApi.list({ pageSize: RECENT_COUNT }, controller.signal).then(
      ({ items }) => setRecent(items),
      () => !controller.signal.aborted && setRecent("error"),
    );
    return () => controller.abort();
  }, [signedIn]);

  const firstName = auth.user?.firstName;
  const newCvButton = (
    <Button
      as={ButtonLink}
      href={cvEditorStepPath()}
      variant="solid"
      color="primary"
    >
      New CV
    </Button>
  );

  const renderStats = () => {
    if (entitlements.status === "loading") {
      return (
        <SOverviewPageStats aria-busy>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} width="100%" height={140} radius="lg" />
          ))}
        </SOverviewPageStats>
      );
    }
    if (entitlements.status === "error") {
      return (
        <Small color="secondary">
          Couldn&apos;t load your plan right now. Your CVs are below.
        </Small>
      );
    }
    const { overview } = entitlements;
    const { cvs, storageBytes, pdfsThisMonth } = overview.usage;
    return (
      <SOverviewPageStats>
        <OverviewPageStat
          label="Plan"
          value={overview.plan.name}
          detail={subscriptionStatusText(overview)}
          action={
            <Button as={ButtonLink} href={PRICING_PATH} size="sm">
              Compare plans
            </Button>
          }
        />
        <OverviewPageStat
          label="CVs"
          value={usedOf(cvs.used, cvs.max)}
          detail={cvs.max === null ? "No limit on your plan" : undefined}
          usage={cvs}
        />
        <OverviewPageStat
          label="Storage"
          value={usedOf(storageBytes.used, storageBytes.max, formatBytes)}
          detail={storageBytes.max === null ? "Used by your CVs" : undefined}
          usage={storageBytes}
        />
        <OverviewPageStat
          label="PDFs this month"
          value={usedOf(pdfsThisMonth.used, pdfsThisMonth.max)}
          detail={
            pdfsThisMonth.max === null ? "No limit on your plan" : undefined
          }
          usage={pdfsThisMonth}
        />
      </SOverviewPageStats>
    );
  };

  const renderRecent = () => {
    if (!recent) {
      return (
        <SOverviewPageRecent aria-busy>
          {Array.from({ length: RECENT_COUNT }, (_, index) => (
            <CvCardSkeleton key={index} />
          ))}
        </SOverviewPageRecent>
      );
    }
    if (recent === "error") {
      return <Small color="secondary">Couldn&apos;t load your CVs.</Small>;
    }
    if (recent.length === 0) {
      return (
        <Small color="secondary">
          No CVs yet. Pick a template and fill in your details to make your
          first one.
        </Small>
      );
    }
    return (
      <SOverviewPageRecent>
        {recent.map((cv) => (
          <CvCard key={cv.id} cv={cv} />
        ))}
      </SOverviewPageRecent>
    );
  };

  const cvLimit =
    entitlements.status === "ready" ? entitlements.usage.cvs : undefined;
  const atCvLimit =
    !!cvLimit && cvLimit.max !== null && cvLimit.used >= cvLimit.max;

  return (
    <SOverviewPage direction="column" gap={6}>
      <Heading as="h4">
        {greeting(new Date().getHours())}
        {firstName && `, ${firstName}`}
      </Heading>
      {renderStats()}
      <Flex direction="column" gap={4}>
        <SOverviewPageSectionHeader
          align="center"
          justify="space-between"
          gap={3}
          wrap="wrap"
        >
          <Strong>Recent CVs</Strong>
          <Flex gap={2}>
            <Button as={ButtonLink} href={MY_CVS_PATH} variant="ghost">
              View all
            </Button>
            {!atCvLimit && newCvButton}
          </Flex>
        </SOverviewPageSectionHeader>
        {atCvLimit && cvLimit?.max != null && (
          <UpgradePrompt
            restriction={{
              kind: "limit",
              limit: "cv.max",
              used: cvLimit.used,
              max: cvLimit.max,
            }}
          />
        )}
        {renderRecent()}
      </Flex>
    </SOverviewPage>
  );
};

export default OverviewPage;
