"use client";

import { usePathname } from "next/navigation";
import SiteFooter from "@/components/site-footer";
import SiteNavLinks from "@/components/site-nav-links";
import TopNav from "@/components/top-nav";
import { STopNavFrost } from "@/components/top-nav/styles";
import { SSiteLayout, SSiteLayoutContent } from "@/layouts/site-layout/styles";
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
        <STopNavFrost>
          <TopNav homeHref="/" title={title} description={description}>
            <SiteNavLinks />
          </TopNav>
        </STopNavFrost>
        <SSiteLayoutContent>{children}</SSiteLayoutContent>
        <SiteFooter />
      </SSiteLayout>
    </AuthProvider>
  );
};

export default SiteLayout;
