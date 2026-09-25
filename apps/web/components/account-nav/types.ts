import type { ReactNode } from "react";

export type TAccountNavMenuItem = {
  label: string;
  href: string;
  icon: ReactNode;
  color?: "error";
};
