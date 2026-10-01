"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Flex,
  Heading,
  Skeleton,
  Small,
} from "@costor/ui";
import ButtonLink from "@/components/button-link";
import SettingsCard from "@/components/settings-card";
import { useAuth } from "@/providers/auth-provider";
import { adminBillingApi, type TAdminPlan } from "@/utils/admin-api";
import { adminPlanPath } from "@/utils/admin-path";
import { ApiError } from "@/utils/api-client";
import { formatMoney } from "@/utils/pricing";

const messageOf = (error: unknown) =>
  error instanceof ApiError
    ? error.message
    : "Couldn't reach the server. Try again.";

/** The plans, what they cost and how many use them; syncing to Paddle. */
const AdminPlansPage = () => {
  const auth = useAuth();
  const [plans, setPlans] = useState<TAdminPlan[] | { error: string }>();
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<
    { success: string } | { error: string }
  >();
  const isSuperAdmin =
    auth.status === "signed-in" && auth.user.role === "SUPER_ADMIN";

  useEffect(() => {
    adminBillingApi
      .plans()
      .then(setPlans, (error: unknown) =>
        setPlans({ error: messageOf(error) }),
      );
  }, []);

  const onSync = async () => {
    setSyncing(true);
    setNotice(undefined);
    try {
      const synced = await adminBillingApi.syncCatalog();
      setNotice({
        success: `Synced to Paddle: ${synced.map(({ planKey, prices }) => `${planKey} (${prices} prices)`).join(", ") || "nothing to sync"}.`,
      });
      setPlans(await adminBillingApi.plans());
    } catch (error) {
      setNotice({ error: messageOf(error) });
    } finally {
      setSyncing(false);
    }
  };

  if (!plans)
    return <Skeleton width="100%" height={300} radius="lg" aria-busy />;
  if ("error" in plans) {
    return (
      <Alert color="error" variant="subtle">
        {plans.error}
      </Alert>
    );
  }

  const unsynced = plans.some(
    (plan) =>
      !plan.archivedAt &&
      plan.prices.some(
        (price) =>
          price.active && price.currency === "EUR" && !price.providerPriceId,
      ),
  );
  return (
    <Flex direction="column" gap={5}>
      {isSuperAdmin && (
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Small color="secondary">
            {unsynced
              ? "Some prices aren't in Paddle yet, so they can't be bought. Sync to publish them."
              : "Prices and plan names are published to Paddle when you sync."}
          </Small>
          <Button
            variant={unsynced ? "solid" : "subtle"}
            color="primary"
            disabled={syncing}
            onClick={onSync}
          >
            {syncing ? "Syncing…" : "Sync to Paddle"}
          </Button>
        </Flex>
      )}
      {notice && (
        <Alert
          color={"error" in notice ? "error" : "success"}
          variant="subtle"
          onClose={() => setNotice(undefined)}
        >
          {"error" in notice ? notice.error : notice.success}
        </Alert>
      )}
      {plans.map((plan) => (
        <SettingsCard
          key={plan.id}
          title={plan.name}
          description={plan.description ?? undefined}
          actions={
            <Button as={ButtonLink} href={adminPlanPath(plan.id)}>
              {isSuperAdmin ? "Edit" : "View"}
            </Button>
          }
        >
          <Flex gap={2} wrap="wrap">
            <Chip radius="pill" size="xs" variant="subtle">
              {plan.key}
            </Chip>
            {plan.isDefault && (
              <Chip radius="pill" size="xs" variant="subtle" color="primary">
                Default
              </Chip>
            )}
            {!plan.isPublic && (
              <Chip radius="pill" size="xs" variant="subtle" color="warning">
                Hidden from pricing
              </Chip>
            )}
            {plan.archivedAt && (
              <Chip radius="pill" size="xs" variant="subtle" color="error">
                Archived
              </Chip>
            )}
          </Flex>
          <Flex gap={6} wrap="wrap">
            <Flex direction="column" gap={0.5}>
              <Small color="secondary">Accounts</Small>
              <Heading as="h6">{plan.subscriptions}</Heading>
            </Flex>
            <Flex direction="column" gap={0.5}>
              <Small color="secondary">Selling at</Small>
              <Heading as="h6">
                {plan.prices.filter((price) => price.active).length === 0
                  ? "Free"
                  : plan.prices
                      .filter((price) => price.active)
                      .map(
                        (price) =>
                          `${formatMoney(price.amountCents / 100, price.currency)} / ${price.period.toLowerCase()}`,
                      )
                      .join(" · ")}
              </Heading>
            </Flex>
          </Flex>
        </SettingsCard>
      ))}
    </Flex>
  );
};

export default AdminPlansPage;
