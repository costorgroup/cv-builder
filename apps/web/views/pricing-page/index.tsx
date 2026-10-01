"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  CheckIcon,
  Container,
  Flex,
  SectionGroup,
  Small,
  Text,
} from "@costor/ui";
import { DEFAULT_CURRENCY } from "@repo/cv-core";
import CurrencyPicker from "@/components/currency-picker";
import FaqList, { type TFaqItem } from "@/components/faq-list";
import PlanCard from "@/components/plan-card";
import SiteSection from "@/components/site-section";
import {
  approximateNote,
  billingPeriodsOf,
  planComparison,
  toPlan,
  type TBillingPeriod,
} from "@/utils/pricing";
import {
  SPricingFaq,
  SPricingHero,
  SPricingNo,
  SPricingPage,
  SPricingPeriods,
  SPricingPlans,
  SPricingSectionBody,
  SPricingTable,
  SPricingTableCard,
  SPricingTitle,
  SPricingYes,
} from "@/views/pricing-page/styles";
import { SECTION_VARIANT } from "@/utils/site";
import type { TPricingPageProps } from "@/views/pricing-page/types";

const FAQ: TFaqItem[] = [
  {
    question: "Can I use CV Builder for free?",
    answer:
      "Yes. The free plan lets you build a CV and download it as a PDF, with no time limit and no card required.",
  },
  {
    question: "Does my subscription renew automatically?",
    answer:
      "Yes. Premium renews at the end of each billing period until you cancel. You can cancel anytime from your dashboard, and you keep Premium until the period you paid for ends.",
  },
  {
    question: "What happens to my CVs when Premium ends?",
    answer:
      "Nothing is deleted. Your CVs stay in your account and you can still open, edit and download them. They keep the Premium look they already have; you just can't pick new Premium options or create CVs beyond the free plan's limit.",
  },
  {
    question: "Are there any hidden costs?",
    answer:
      "No. The price you see is the price you pay. Any VAT that applies in your country is shown before you pay.",
  },
  {
    question: "Can I switch plans later?",
    answer:
      "Yes. You can upgrade at any time, and your existing CVs carry straight over.",
  },
  {
    question: "What format are CVs downloaded in?",
    answer: "Every plan downloads print-ready A4 PDFs.",
  },
];

const renderValue = (value: string | boolean) => {
  if (value === true)
    return (
      <SPricingYes aria-label="Included">
        <CheckIcon />
      </SPricingYes>
    );
  if (value === false)
    return <SPricingNo aria-label="Not included">—</SPricingNo>;
  return value;
};

const PricingPage = ({ plans }: TPricingPageProps) => {
  const cards = useMemo(
    () =>
      (plans?.plans ?? []).map((plan) =>
        toPlan(
          plan,
          plans?.currency ?? DEFAULT_CURRENCY,
          plans?.approximate,
          plans?.freeTemplateCount,
        ),
      ),
    [plans],
  );
  const periods = billingPeriodsOf(cards);
  const comparison = useMemo(() => planComparison(plans?.plans ?? []), [plans]);
  const [chosenPeriod, setPeriod] = useState<TBillingPeriod>("yearly");
  // Yearly by default, if any plan is sold yearly.
  const period = periods.some(({ id }) => id === chosenPeriod)
    ? chosenPeriod
    : (periods[0]?.id ?? chosenPeriod);

  return (
    <SPricingPage direction="column">
      <SPricingHero radius="lg">
        <Flex direction="column" align="center" gap={3}>
          <SPricingTitle as="h1">Simple, honest pricing</SPricingTitle>
          <Text color="secondary">
            Start for free. Upgrade to Premium when you want every template and
            unlimited CVs.
          </Text>
        </Flex>
        {!plans && (
          <Alert color="warning" variant="subtle">
            Plans couldn&apos;t be loaded right now. Try again in a moment.
          </Alert>
        )}
        <Flex align="center" justify="center" gap={3} wrap="wrap">
          {periods.length > 1 && (
            <SPricingPeriods role="group" aria-label="Billing period">
              {periods.map(({ id, label }) => (
                <Button
                  key={id}
                  type="button"
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
            </SPricingPeriods>
          )}
          {plans && (
            <CurrencyPicker
              currency={plans.currency}
              currencies={plans.currencies}
            />
          )}
        </Flex>
        <SPricingPlans>
          {cards.map((plan) => (
            <PlanCard key={plan.id} plan={plan} period={period} />
          ))}
        </SPricingPlans>
        {plans?.approximate && (
          <Small color="secondary">
            {approximateNote(plans.approximate, plans.currency)}
          </Small>
        )}
      </SPricingHero>

      <Container maxWidth="lg" disableGutters>
        <SectionGroup
          variant={SECTION_VARIANT}
          align="center"
          color="primary"
          gap={16}
        >
          {cards.length > 1 && (
            <SiteSection title="Compare plans">
              <SPricingSectionBody direction="column" align="center">
                <SPricingTableCard radius="lg">
                  <SPricingTable>
                    <thead>
                      <tr>
                        <th scope="col">Feature</th>
                        {cards.map((plan) => (
                          <th key={plan.id} scope="col">
                            {plan.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.map(([feature, ...values]) => (
                        <tr key={feature}>
                          <th scope="row">{feature}</th>
                          {values.map((value, index) => (
                            <td key={cards[index]?.id ?? index}>
                              {renderValue(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </SPricingTable>
                </SPricingTableCard>
              </SPricingSectionBody>
            </SiteSection>
          )}

          <SiteSection title="Pricing questions">
            <SPricingSectionBody direction="column" align="center">
              <SPricingFaq>
                <FaqList items={FAQ} />
              </SPricingFaq>
            </SPricingSectionBody>
          </SiteSection>
        </SectionGroup>
      </Container>
    </SPricingPage>
  );
};

export default PricingPage;
