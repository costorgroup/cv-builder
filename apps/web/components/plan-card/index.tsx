"use client";

import { Button, CheckIcon, Chip, Flex, Heading, Small, Text } from "@costor/ui";
import ButtonLink from "@/components/button-link";
import {
  SPlanCard,
  SPlanCardFeature,
  SPlanCardFeatures,
  SPlanCardPrice,
} from "@/components/plan-card/styles";
import type { TPlanCardProps } from "@/components/plan-card/types";
import { formatEuro, savingPercent } from "@/utils/pricing";
import { useStartCvHref } from "@/utils/start-cv";

const PERIOD_NOTE = {
  monthly: "Billed monthly",
  quarterly: "Billed every 3 months",
  yearly: "Billed yearly",
};

export const PlanCard = ({ plan, period }: TPlanCardProps) => {
  const startHref = useStartCvHref();
  const price = plan.prices?.[period];
  const saving = plan.prices ? savingPercent(plan.prices, period) : 0;

  return (
    <SPlanCard radius="lg" highlighted={plan.highlighted}>
      <Flex direction="column" gap={2}>
        <Flex align="center" justify="space-between" gap={2}>
          <Heading as="h4">{plan.name}</Heading>
          {plan.highlighted && (
            <Chip size="sm" variant="solid" color="primary">
              Most popular
            </Chip>
          )}
        </Flex>
        <Text color="secondary">{plan.tagline}</Text>
      </Flex>
      <Flex direction="column" gap={2}>
        <SPlanCardPrice>
          {formatEuro(price ? price.total / price.months : 0)}
          <Small color="secondary">/ month</Small>
        </SPlanCardPrice>
        <Flex align="center" gap={2} wrap="wrap">
          <Small color="secondary">
            {price
              ? `${PERIOD_NOTE[period]} · ${formatEuro(price.total)}`
              : "Free forever, no card needed"}
          </Small>
          {saving > 0 && (
            <Chip size="xs" variant="subtle" color="success">
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
        href={startHref}
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
