"use client";

import { useState } from "react";
import {
  Button,
  CheckIcon,
  Container,
  Flex,
  SectionGroup,
  Text,
} from "@costor/ui";
import FaqList, { type TFaqItem } from "@/components/faq-list";
import PlanCard from "@/components/plan-card";
import SiteSection from "@/components/site-section";
import {
  BILLING_PERIODS,
  PLAN_COMPARISON,
  PLANS,
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

const FAQ: TFaqItem[] = [
  {
    question: "Can I use CV Builder for free?",
    answer:
      "Yes. The free plan lets you build a CV and download it as a PDF, with no time limit and no card required.",
  },
  {
    question: "Does my subscription renew automatically?",
    answer:
      "No. Premium is a one-off payment for the period you choose. When it ends you go back to the free plan unless you decide to buy again.",
  },
  {
    question: "What happens to my CVs when Premium ends?",
    answer:
      "Nothing is deleted. Your CVs stay in your account and you can still open and download them; Premium-only options just become read-only.",
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

const PricingPage = () => {
  const [period, setPeriod] = useState<TBillingPeriod>("yearly");

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
        <SPricingPeriods role="group" aria-label="Billing period">
          {BILLING_PERIODS.map(({ id, label }) => (
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
        <SPricingPlans>
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} period={period} />
          ))}
        </SPricingPlans>
      </SPricingHero>

      <Container maxWidth="lg" disableGutters>
        <SectionGroup
          variant={SECTION_VARIANT}
          align="center"
          color="primary"
          gap={16}
        >
          <SiteSection title="Compare plans">
            <SPricingSectionBody direction="column" align="center">
              <SPricingTableCard radius="lg">
                <SPricingTable>
                  <thead>
                    <tr>
                      <th scope="col">Feature</th>
                      {PLANS.map((plan) => (
                        <th key={plan.id} scope="col">
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PLAN_COMPARISON.map(([feature, free, premium]) => (
                      <tr key={feature}>
                        <th scope="row">{feature}</th>
                        <td>{renderValue(free)}</td>
                        <td>{renderValue(premium)}</td>
                      </tr>
                    ))}
                  </tbody>
                </SPricingTable>
              </SPricingTableCard>
            </SPricingSectionBody>
          </SiteSection>

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
