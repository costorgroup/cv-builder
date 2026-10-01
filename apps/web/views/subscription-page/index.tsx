"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Alert,
  Button,
  CheckIcon,
  Chip,
  Flex,
  Heading,
  Skeleton,
  Small,
  Strong,
  useTheme,
} from "@costor/ui";
import {
  DEFAULT_CURRENCY,
  type TAccountOverview,
  type TPlanPeriod,
} from "@repo/cv-core";
import CurrencyPicker from "@/components/currency-picker";
import SettingsCard from "@/components/settings-card";
import { isConfirmCancelled, useConfirm } from "@/providers/confirm-provider";
import { useEntitlements } from "@/providers/entitlements-provider";
import { ApiError } from "@/utils/api-client";
import { billingApi, type TBillingConfig } from "@/utils/billing-api";
import { closeCheckout, openCheckout } from "@/utils/paddle-checkout";
import {
  plansApi,
  type TPublicPlan,
  type TPublicPlans,
} from "@/utils/plans-api";
import {
  approximateNote,
  formatApproximate,
  formatMoney,
  toPlan,
} from "@/utils/pricing";
import { subscriptionStatusText } from "@/utils/subscription-status";
import {
  SSubscriptionPage,
  SSubscriptionPageFeatures,
  SSubscriptionPagePlan,
  SSubscriptionPagePlanAction,
  SSubscriptionPagePlans,
} from "@/views/subscription-page/styles";
import type { TSubscriptionPageProps } from "@/views/subscription-page/types";

const PERIODS: { id: TPlanPeriod; label: string; per: string }[] = [
  { id: "MONTHLY", label: "Monthly", per: "month" },
  { id: "QUARTERLY", label: "Quarterly", per: "3 months" },
  { id: "YEARLY", label: "Yearly", per: "year" },
];

const periodOf = (id: TPlanPeriod) =>
  PERIODS.find((period) => period.id === id) ?? PERIODS[0]!;

const longDate = new Intl.DateTimeFormat(undefined, { dateStyle: "long" });

const messageOf = (error: unknown) =>
  error instanceof ApiError || error instanceof Error
    ? error.message
    : "Something went wrong. Try again.";

/** The subscription the user pays for now, if any. */
const paidSubscription = (overview: TAccountOverview | undefined) => {
  const subscription = overview?.subscription;
  return subscription?.managed &&
    subscription.plan.key === overview?.plan.key &&
    subscription.status !== "EXPIRED"
    ? subscription
    : undefined;
};

type TNotice = { success: string } | { error: string };

/**
 * The current plan, and buying, switching or canceling one. Payments go
 * through the provider's checkout; the API applies the result.
 */
const SubscriptionPage = ({
  initialPeriod,
  pendingCheckoutId,
}: TSubscriptionPageProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const entitlements = useEntitlements();
  // A team's plan is changed by its owner only; everyone else can look.
  const { team } = entitlements;
  const target = { teamId: team?.id };
  const canManage = !team || team.role === "OWNER";
  const confirm = useConfirm();
  const { mode } = useTheme();
  const [result, setResult] = useState<TPublicPlans | "error">();
  const [config, setConfig] = useState<TBillingConfig>();
  // Bumped when the currency changes, to load the prices in it.
  const [version, setVersion] = useState(0);
  const [chosenPeriod, setPeriod] = useState<TPlanPeriod | undefined>(
    initialPeriod,
  );
  // What's running, so buttons can't start a second one.
  const [busy, setBusy] = useState<string>();
  const [notice, setNotice] = useState<TNotice>();

  useEffect(() => {
    const controller = new AbortController();
    plansApi.list(controller.signal).then(setResult, () => {
      if (!controller.signal.aborted) setResult("error");
    });
    return () => controller.abort();
  }, [version]);

  useEffect(() => {
    billingApi.config().then(setConfig, () => setConfig({ provider: "none" }));
  }, []);

  const overview =
    entitlements.status === "ready" ? entitlements.overview : undefined;
  const paid = paidSubscription(overview);
  const plans = result === "error" ? "error" : result?.plans;
  const currency =
    result && result !== "error" ? result.currency : DEFAULT_CURRENCY;
  const approximate = result && result !== "error" ? result.approximate : null;
  const freeTemplateCount =
    result && result !== "error" ? result.freeTemplateCount : undefined;
  const paymentsOn = config?.provider === "paddle" && !!config.clientToken;

  const periods = useMemo(
    () =>
      PERIODS.filter(({ id }) =>
        (plans === "error" ? [] : (plans ?? [])).some((plan) =>
          plan.prices.some((price) => price.period === id),
        ),
      ),
    [plans],
  );
  // What was asked for, else what the user pays, else yearly, else the first.
  const period =
    [chosenPeriod, paid?.period, "YEARLY" as const].find(
      (id) => id && periods.some((each) => each.id === id),
    ) ?? periods[0]?.id;

  /** Runs a billing action, then shows the plan as it is now. */
  const run = async (
    key: string,
    action: () => Promise<unknown>,
    success: string,
  ) => {
    setBusy(key);
    setNotice(undefined);
    try {
      await action();
      entitlements.reload();
      setNotice({ success });
    } catch (error) {
      setNotice({ error: messageOf(error) });
    } finally {
      setBusy(undefined);
    }
  };

  const confirmed = async (options: Parameters<typeof confirm>[0]) => {
    try {
      await confirm(options);
      return true;
    } catch (error) {
      if (isConfirmCancelled(error)) return false;
      throw error;
    }
  };

  const onUpgrade = async (plan: TPublicPlan, planPeriod: TPlanPeriod) => {
    if (!config) return;
    setBusy("checkout");
    setNotice(undefined);
    try {
      const { checkoutId } = await billingApi.startCheckout({
        ...target,
        planKey: plan.key,
        period: planPeriod,
      });
      await openCheckout(
        config,
        checkoutId,
        {
          completed: (paidCheckoutId) => {
            setBusy("activating");
            billingApi
              .completeCheckout(paidCheckoutId, target)
              .then(({ status }) => {
                entitlements.reload();
                closeCheckout();
                setNotice({
                  success:
                    status === "active"
                      ? `You're on ${plan.name}. Thank you!`
                      : "Payment received. Your plan switches on in a moment.",
                });
              })
              .catch((error: unknown) => setNotice({ error: messageOf(error) }))
              .finally(() => setBusy(undefined));
          },
          closed: () =>
            setBusy((current) =>
              current === "checkout" ? undefined : current,
            ),
        },
        mode === "dark" ? "dark" : "light",
      );
    } catch (error) {
      setNotice({ error: messageOf(error) });
      setBusy(undefined);
    }
  };

  // A checkout Paddle linked to: opened once billing is ready.
  const openedPending = useRef(false);
  useEffect(() => {
    if (!pendingCheckoutId || !paymentsOn || !config || openedPending.current) {
      return;
    }
    openedPending.current = true;
    // The link is used up; reloading shouldn't open it again.
    router.replace(pathname);
    openCheckout(
      config,
      pendingCheckoutId,
      {
        completed: (paidCheckoutId) => {
          // It may not be a new plan (e.g. a card update), so a refusal to
          // apply one is fine; the plan is shown as it is either way.
          billingApi
            .completeCheckout(paidCheckoutId, { teamId: team?.id })
            .catch(() => undefined)
            .finally(() => {
              entitlements.reload();
              closeCheckout();
              setNotice({ success: "Done. Thank you!" });
            });
        },
        closed: () => undefined,
      },
      mode === "dark" ? "dark" : "light",
    ).catch((error: unknown) => setNotice({ error: messageOf(error) }));
  }, [
    pendingCheckoutId,
    paymentsOn,
    config,
    router,
    pathname,
    entitlements,
    team,
    mode,
  ]);

  const onSwitch = async (plan: TPublicPlan, planPeriod: TPlanPeriod) => {
    if (
      !(await confirmed({
        title: `Switch to ${plan.name}, billed ${periodOf(planPeriod).label.toLowerCase()}?`,
        description:
          "The change starts now. You're charged, or credited, the difference for the rest of this billing period.",
        confirmLabel: "Switch",
      }))
    ) {
      return;
    }
    await run(
      "switch",
      () =>
        billingApi.changePlan({
          ...target,
          planKey: plan.key,
          period: planPeriod,
        }),
      `You're now billed ${periodOf(planPeriod).label.toLowerCase()}.`,
    );
  };

  const onCancel = async () => {
    const end = paid?.currentPeriodEnd
      ? longDate.format(new Date(paid.currentPeriodEnd))
      : "the end of this billing period";
    if (
      !(await confirmed({
        title: `Cancel ${paid?.plan.name}?`,
        description: `You keep it until ${end}, then move to the free plan. Your CVs stay, and you won't be charged again.`,
        confirmLabel: "Cancel plan",
        cancelLabel: "Keep it",
        color: "error",
      }))
    ) {
      return;
    }
    await run(
      "cancel",
      () => billingApi.cancel(target),
      `Canceled. You keep your plan until ${end}.`,
    );
  };

  const onPortal = async () => {
    setBusy("portal");
    try {
      window.location.assign((await billingApi.portal(target)).url);
    } catch (error) {
      setNotice({ error: messageOf(error) });
      setBusy(undefined);
    }
  };

  /** The button for a plan at the chosen period. */
  const planAction = (plan: TPublicPlan) => {
    const price = plan.prices.find((each) => each.period === period);
    const isFree = plan.prices.length === 0;
    const isCurrentPlan = plan.key === overview?.plan.key;
    if (!canManage) {
      return (
        <Button fullWidth disabled>
          {isCurrentPlan ? "Team plan" : "Owner only"}
        </Button>
      );
    }
    if (!paymentsOn) {
      return (
        <Button fullWidth disabled>
          {isCurrentPlan ? "Your plan" : "Coming soon"}
        </Button>
      );
    }
    if (isFree) {
      return paid ? (
        <Button
          fullWidth
          disabled={!!busy || paid.cancelAtPeriodEnd}
          onClick={onCancel}
        >
          {paid.cancelAtPeriodEnd
            ? "Starts when your plan ends"
            : "Switch to Free"}
        </Button>
      ) : (
        <Button fullWidth disabled>
          Your plan
        </Button>
      );
    }
    if (!price || !period) {
      return (
        <Button fullWidth disabled>
          Not sold {periodOf(period ?? "MONTHLY").label.toLowerCase()}
        </Button>
      );
    }
    if (paid && isCurrentPlan && paid.period === period) {
      return (
        <Button fullWidth disabled>
          Your plan
        </Button>
      );
    }
    if (paid) {
      return (
        <Button
          fullWidth
          variant="solid"
          color="primary"
          disabled={!!busy}
          onClick={() => onSwitch(plan, period)}
        >
          {isCurrentPlan
            ? `Switch to ${periodOf(period).label.toLowerCase()}`
            : `Switch to ${plan.name}`}
        </Button>
      );
    }
    return (
      <Button
        fullWidth
        variant="solid"
        color="primary"
        disabled={!!busy}
        onClick={() => onUpgrade(plan, period)}
      >
        {busy === "checkout" ? "Opening checkout…" : `Upgrade to ${plan.name}`}
      </Button>
    );
  };

  const renderCurrentPlan = () => {
    if (entitlements.status === "loading") {
      return <Skeleton width="100%" height={160} radius="lg" aria-busy />;
    }
    if (!overview) {
      return (
        <Alert color="error" variant="subtle">
          Couldn&apos;t load your plan. Try again in a moment.
        </Alert>
      );
    }
    return (
      <SettingsCard
        title={team ? "Team plan" : "Your plan"}
        description={subscriptionStatusText(overview) ?? "Active"}
        actions={
          paid &&
          canManage && (
            <>
              <Button disabled={!!busy} onClick={onPortal}>
                {busy === "portal" ? "Opening…" : "Invoices & payment method"}
              </Button>
              {paid.cancelAtPeriodEnd ? (
                <Button
                  variant="solid"
                  color="primary"
                  disabled={!!busy}
                  onClick={() =>
                    run(
                      "resume",
                      () => billingApi.resume(target),
                      "Your plan will keep renewing.",
                    )
                  }
                >
                  Keep my plan
                </Button>
              ) : (
                <Button color="error" disabled={!!busy} onClick={onCancel}>
                  Cancel plan
                </Button>
              )}
            </>
          )
        }
      >
        <Flex align="baseline" gap={2} wrap="wrap">
          <Heading as="h4">{overview.plan.name}</Heading>
          {paid?.period && (
            <Small color="secondary">
              billed {periodOf(paid.period).label.toLowerCase()}
            </Small>
          )}
        </Flex>
        {paid?.status === "PAST_DUE" && (
          <Alert color="warning" variant="subtle" size="sm">
            Your last payment didn&apos;t go through. Update your payment method
            to keep your plan.
          </Alert>
        )}
      </SettingsCard>
    );
  };

  return (
    <SSubscriptionPage direction="column" gap={5}>
      {renderCurrentPlan()}
      {!canManage && (
        <Alert color="info" variant="subtle" size="sm">
          Only the team&apos;s owner can change its plan or payment details.
        </Alert>
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
      {busy === "activating" && (
        <Alert color="info" variant="subtle">
          Payment received. Switching your plan on…
        </Alert>
      )}
      {config && !paymentsOn && (
        <Alert color="info" variant="subtle" size="sm">
          Changing plans online is coming soon. Your CVs and settings stay as
          they are when you do.
        </Alert>
      )}

      <Flex align="center" justify="space-between" gap={3} wrap="wrap">
        {periods.length > 1 && (
          <Flex role="group" aria-label="Billing period" gap={1}>
            {periods.map(({ id, label }) => (
              <Button
                key={id}
                size="sm"
                radius="pill"
                variant={id === period ? "solid" : "ghost"}
                color={id === period ? "primary" : "default"}
                aria-pressed={id === period}
                onClick={() => setPeriod(id)}
              >
                {label}
              </Button>
            ))}
          </Flex>
        )}
        {result && result !== "error" && (
          <CurrencyPicker
            currency={result.currency}
            currencies={result.currencies}
            onChange={() => setVersion((count) => count + 1)}
          />
        )}
      </Flex>

      {plans === "error" ? (
        <Alert color="error" variant="subtle">
          Couldn&apos;t load the plans. Try again in a moment.
        </Alert>
      ) : (
        <SSubscriptionPagePlans aria-busy={!plans}>
          {!plans
            ? Array.from({ length: 2 }, (_, index) => (
                <Skeleton key={index} width="100%" height={380} radius="lg" />
              ))
            : plans.map((plan) => {
                const current = plan.key === overview?.plan.key;
                const price = plan.prices.find(
                  (each) => each.period === period,
                );
                return (
                  <SSubscriptionPagePlan
                    key={plan.key}
                    radius="lg"
                    current={current}
                  >
                    <Flex direction="column" gap={2}>
                      <Flex align="center" justify="space-between" gap={2}>
                        <Strong>{plan.name}</Strong>
                        {current && (
                          <Chip
                            radius="pill"
                            size="sm"
                            variant="solid"
                            color="primary"
                          >
                            Current plan
                          </Chip>
                        )}
                      </Flex>
                      {plan.description && (
                        <Small color="secondary">{plan.description}</Small>
                      )}
                    </Flex>
                    <Heading as="h4">
                      {plan.prices.length === 0
                        ? "Free"
                        : price
                          ? formatMoney(price.amountCents / 100, price.currency)
                          : "—"}
                      {price && (
                        <Small color="secondary">
                          {" "}
                          / {periodOf(price.period).per}
                        </Small>
                      )}
                    </Heading>
                    {price && approximate && (
                      <Small color="secondary">
                        {formatApproximate(
                          price.amountCents / 100,
                          approximate,
                        )}{" "}
                        / {periodOf(price.period).per}
                      </Small>
                    )}
                    <SSubscriptionPageFeatures>
                      {toPlan(
                        plan,
                        currency,
                        null,
                        freeTemplateCount,
                      ).features.map((bullet) => (
                        <li key={bullet}>
                          <CheckIcon />
                          <Small>{bullet}</Small>
                        </li>
                      ))}
                    </SSubscriptionPageFeatures>
                    <SSubscriptionPagePlanAction>
                      {planAction(plan)}
                    </SSubscriptionPagePlanAction>
                  </SSubscriptionPagePlan>
                );
              })}
        </SSubscriptionPagePlans>
      )}
      {paymentsOn && (
        <Small color="secondary">
          Plans renew automatically until you cancel. Prices include VAT where
          it applies; the exact amount in your currency is shown at checkout.
          Payments are handled by Paddle.
          {approximate && ` ${approximateNote(approximate, currency)}`}
        </Small>
      )}
    </SSubscriptionPage>
  );
};

export default SubscriptionPage;
