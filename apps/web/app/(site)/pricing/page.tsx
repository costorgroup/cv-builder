import type { Metadata } from "next";
import { PricingPage } from "@/views";
import { getPublicPlans } from "@/utils/public-plans";

export const metadata: Metadata = {
  title: "Pricing | CV Builder",
  description:
    "Start free and upgrade to Premium for every template, color scheme and font.",
};

export default async () => <PricingPage plans={await getPublicPlans()} />;
