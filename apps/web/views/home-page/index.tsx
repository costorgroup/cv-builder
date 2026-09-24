"use client";

import { SButton, SHomePage, STitle } from "@/views/home-page/styles";
import type { THomePageProps } from "@/views/home-page/types";

const HomePage = ({ title = "CV Builder" }: THomePageProps) => (
  <SHomePage>
    <STitle>{title}</STitle>
    <SButton variant="solid" size="md">
      Get started
    </SButton>
  </SHomePage>
);

export default HomePage;
