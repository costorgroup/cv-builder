"use client";

import { AppNavigation } from "@/components";
import {
  SContent,
  SCvDisplay,
  SLeftBox,
  SManageCvPage,
  SRightBox,
} from "./styles";
import type { TManageCvPageProps } from "./types";

export const ManageCvPage = (_props: TManageCvPageProps) => (
  <SManageCvPage>
    <AppNavigation />
    <SContent>
      <SLeftBox />
      <SCvDisplay />
      <SRightBox />
    </SContent>
  </SManageCvPage>
);

export type { TManageCvPageProps };

