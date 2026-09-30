import type { ReactNode } from "react";

export type TFaqItem = {
  question: string;
  answer: ReactNode;
};

export type TFaqListProps = {
  items: TFaqItem[];
};
