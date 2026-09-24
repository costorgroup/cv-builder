import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/providers";
import { getThemeAppearance } from "@/utils/get-theme-appearance";
import { cvFontVariables } from "@/fonts";

export const metadata: Metadata = {
  title: "CV Builder",
  description: "Build your CV",
};

const RootLayout = async ({ children }: Readonly<{ children: ReactNode }>) => (
  <html lang="en" className={cvFontVariables}>
    <body>
      <Providers defaultAppearance={await getThemeAppearance()}>
        {children}
      </Providers>
    </body>
  </html>
);

export default RootLayout;
