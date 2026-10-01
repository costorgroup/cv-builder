import type { Metadata } from "next";
import { HomePage } from "@/views";
import { getPublicPlans } from "@/utils/public-plans";
import { getPublicTemplates } from "@/utils/public-templates";

export const metadata: Metadata = {
  title: "CV Builder | Build a CV that gets you noticed",
  description:
    "Create a professional CV in minutes with beautiful templates, a live preview and pixel-perfect PDF downloads.",
};

export default async () => {
  const [plans, templates] = await Promise.all([
    getPublicPlans(),
    getPublicTemplates(),
  ]);
  return <HomePage plans={plans} templates={templates} />;
};
