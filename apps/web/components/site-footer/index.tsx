"use client";

import Image from "next/image";
import { Flex, Small, Strong } from "@costor/ui";
import {
  SSiteFooter,
  SSiteFooterBottom,
  SSiteFooterBrand,
  SSiteFooterColumn,
  SSiteFooterGrid,
  SSiteFooterLink,
} from "@/components/site-footer/styles";
import { MY_CVS_PATH } from "@/utils/dashboard-path";
import { useAuth } from "@/providers/auth-provider";
import {
  CONTACT_EMAIL,
  HOME_SECTIONS,
  LEGAL_LINKS,
  PRICING_PATH,
  SITE_NAME,
  type TSiteLink,
} from "@/utils/site";

const PRODUCT_LINKS: TSiteLink[] = [
  ...HOME_SECTIONS.map(({ id, label }) => ({ label, href: `/#${id}` })),
  { label: "Pricing", href: PRICING_PATH },
];

const SIGNED_IN_LINKS: TSiteLink[] = [
  { label: "My CVs", href: MY_CVS_PATH },
  { label: "Settings", href: "/auth/change-password" },
  { label: "Sign out", href: "/auth/sign-out" },
];

const SIGNED_OUT_LINKS: TSiteLink[] = [
  { label: "Sign in", href: "/auth/sign-in" },
  { label: "Create account", href: "/auth/sign-up" },
];

export const SiteFooter = () => {
  const { status } = useAuth();
  const columns = [
    { title: "Product", links: PRODUCT_LINKS },
    {
      title: "Account",
      links: status === "signed-in" ? SIGNED_IN_LINKS : SIGNED_OUT_LINKS,
    },
    { title: "Legal", links: LEGAL_LINKS },
  ];

  return (
    <SSiteFooter radius="none">
      <SSiteFooterGrid>
        <SSiteFooterBrand>
          <Flex align="center" gap={3}>
            <Image src="/logo.png" alt="" width={32} height={32} />
            <Strong>{SITE_NAME}</Strong>
          </Flex>
          <Small color="secondary">
            Build a professional CV in minutes, pick from beautiful templates
            and download a pixel-perfect PDF.
          </Small>
        </SSiteFooterBrand>
        {columns.map(({ title, links }) => (
          <SSiteFooterColumn key={title} aria-label={title}>
            <Strong>{title}</Strong>
            {links.map(({ label, href }) => (
              <SSiteFooterLink key={href} href={href}>
                {label}
              </SSiteFooterLink>
            ))}
          </SSiteFooterColumn>
        ))}
      </SSiteFooterGrid>
      <SSiteFooterBottom>
        <Small color="secondary">
          © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </Small>
        <Small color="secondary">Questions? {CONTACT_EMAIL}</Small>
      </SSiteFooterBottom>
    </SSiteFooter>
  );
};

export default SiteFooter;
