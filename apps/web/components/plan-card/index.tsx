"use client";

import {
  Button,
  CheckIcon,
  Chip,
  Flex,
  Heading,
  Small,
  Text,
} from "@costor/ui";
import ButtonLink from "@/components/button-link";
import {
  SPlanCard,
  SPlanCardFeature,
  SPlanCardFeatures,
  SPlanCardPrice,
} from "@/components/plan-card/styles";
import type { TPlanCardProps } from "@/components/plan-card/types";
import {
  BILLING_PERIODS,
  formatApproximate,
  formatMoney,
  savingPercent,
} from "@/utils/pricing";
import { SUBSCRIPTION_PATH } from "@/utils/dashboard-path";
import { useStartCvHref } from "@/utils/start-cv";

const PERIOD_NOTE = {
  monthly: "Billed monthly",
  quarterly: "Billed every 3 months",
  yearly: "Billed yearly",
};

export const PlanCard = ({ plan, period }: TPlanCardProps) => {
  const startHref = useStartCvHref();
  // A plan not sold for this period shows the first one it is sold for.
  const pricePeriod = plan.prices?.[period]
    ? period
    : BILLING_PERIODS.find(({ id }) => plan.prices?.[id])?.id;
  const price = pricePeriod ? plan.prices?.[pricePeriod] : undefined;
  const saving =
    plan.prices && pricePeriod ? savingPercent(plan.prices, pricePeriod) : 0;

  return (
    <SPlanCard radius="lg" highlighted={plan.highlighted}>
      <Flex direction="column" gap={2}>
        <Flex align="center" justify="space-between" gap={2}>
          <Heading as="h4">{plan.name}</Heading>
          {plan.highlighted && (
            <Chip radius="pill" size="sm" variant="solid" color="primary">
              Most popular
            </Chip>
          )}
        </Flex>
        <Text color="secondary">{plan.tagline}</Text>
      </Flex>
      <Flex direction="column" gap={2}>
        <SPlanCardPrice>
          {formatMoney(
            price ? price.total / price.months : 0,
            price?.currency ?? plan.currency,
          )}
          <Small color="secondary">/ month</Small>
        </SPlanCardPrice>
        {price && plan.approximate && (
          <Small color="secondary">
            {formatApproximate(price.total / price.months, plan.approximate)} /
            month
          </Small>
        )}
        <Flex align="center" gap={2} wrap="wrap">
          <Small color="secondary">
            {price && pricePeriod
              ? `${PERIOD_NOTE[pricePeriod]} · ${formatMoney(price.total, price.currency)}`
              : "Free forever, no card needed"}
          </Small>
          {saving > 0 && (
            <Chip radius="pill" size="xs" variant="subtle" color="success">
              Save {saving}%
            </Chip>
          )}
        </Flex>
      </Flex>
      <SPlanCardFeatures>
        {plan.features.map((feature) => (
          <SPlanCardFeature key={feature}>
            <CheckIcon />
            {feature}
          </SPlanCardFeature>
        ))}
      </SPlanCardFeatures>
      <Button
        as={ButtonLink}
        // Paid plans are bought on the Subscription page (signing in first).
        href={
          plan.prices
            ? `${SUBSCRIPTION_PATH}?period=${(pricePeriod ?? period).toUpperCase()}`
            : startHref
        }
        variant={plan.highlighted ? "solid" : "outline"}
        color={plan.highlighted ? "primary" : "default"}
        size="lg"
        fullWidth
      >
        {plan.prices ? `Get ${plan.name}` : "Start for free"}
      </Button>
    </SPlanCard>
  );
};

export default PlanCard;
