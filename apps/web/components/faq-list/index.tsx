"use client";

import { Accordion, AccordionGroup, ArrowBottomIcon } from "@costor/ui";
import { SFaqListAnswer, SFaqListQuestion } from "@/components/faq-list/styles";
import type { TFaqListProps } from "@/components/faq-list/types";

/** Questions that open one at a time, on solid inverted panels. */
export const FaqList = ({ items }: TFaqListProps) => (
  <AccordionGroup
    variant="solid"
    color="inverted"
    colorScope="all"
    size="lg"
    radius="lg"
    exclusive
  >
    {items.map(({ question, answer }) => (
      <Accordion
        key={question}
        value={question}
        summary={<SFaqListQuestion>{question}</SFaqListQuestion>}
        icon={<ArrowBottomIcon />}
        expandIconPosition="right"
      >
        <SFaqListAnswer>{answer}</SFaqListAnswer>
      </Accordion>
    ))}
  </AccordionGroup>
);

export type { TFaqItem } from "@/components/faq-list/types";
export default FaqList;
