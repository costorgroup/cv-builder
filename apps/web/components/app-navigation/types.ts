import type { TNavigationProps } from "@costor/ui";

export type TAppNavigationProps = Omit<TNavigationProps, "children">;

export type TAppNavigationLink = {
  href: string;
  label: string;
};
