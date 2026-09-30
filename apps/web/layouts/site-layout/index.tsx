"use client";

import { usePathname } from "next/navigation";
import SiteFooter from "@/components/site-footer";
import SiteNavLinks from "@/components/site-nav-links";
import TopNav from "@/components/top-nav";
import {
  SSiteLayout,
  SSiteLayoutContent,
  SSiteLayoutNav,
} from "@/layouts/site-layout/styles";
import type {
  TSiteLayoutPage,
  TSiteLayoutProps,
} from "@/layouts/site-layout/types";
import { AuthProvider } from "@/providers/auth-provider";
import { PRICING_PATH, SITE_NAME } from "@/utils/site";

const PAGES: Record<string, TSiteLayoutPage> = {
  [PRICING_PATH]: {
    title: "Pricing",
    description: "Start free, upgrade when you need more",
  },
};

const DEFAULT_PAGE: TSiteLayoutPage = {
  title: SITE_NAME,
  description: "Build a CV that gets you noticed",
};

/** The public pages: home, pricing and the legal pages. Open to everyone. */
const SiteLayout = ({ children }: TSiteLayoutProps) => {
  const pathname = usePathname();
  const { title, description } = PAGES[pathname] ?? DEFAULT_PAGE;

  return (
    <AuthProvider>
      <SSiteLayout>
        <SSiteLayoutNav>
          <TopNav homeHref="/" title={title} description={description}>
            <SiteNavLinks />
          </TopNav>
        </SSiteLayoutNav>
        <SSiteLayoutContent>{children}</SSiteLayoutContent>
        <SiteFooter />
      </SSiteLayout>
    </AuthProvider>
  );
};

export default SiteLayout;
