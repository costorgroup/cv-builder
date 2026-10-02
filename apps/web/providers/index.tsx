"use client";

import { GlobalStyles, ThemeProvider, type TThemeAppearance } from "@costor/ui";
import type { ReactNode } from "react";
import { AppGlobalStyles } from "@/providers/app-global-styles";
import { ConfirmProvider } from "@/providers/confirm-provider";
import { EmotionRegistry } from "./emotion-registry";

export * from "@/providers/cv-provider";

type TProvidersProps = {
  children: ReactNode;
  defaultAppearance?: TThemeAppearance;
};

export const Providers = ({ children, defaultAppearance }: TProvidersProps) => (
  <EmotionRegistry>
    <ThemeProvider storage="cookie" defaultAppearance={defaultAppearance}>
      <GlobalStyles />
      <AppGlobalStyles />
      <ConfirmProvider>{children}</ConfirmProvider>
    </ThemeProvider>
  </EmotionRegistry>
);
