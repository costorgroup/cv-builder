"use client";

import { SButton, SHomePage, STitle } from "./styles";
import type { THomePageProps } from "./types";

export const HomePage = ({ title = "CV Builder" }: THomePageProps) => (
  <SHomePage>
    <STitle>{title}</STitle>
    <SButton variant="solid" size="md">
      Get started
    </SButton>
  </SHomePage>
);

export type { THomePageProps };
