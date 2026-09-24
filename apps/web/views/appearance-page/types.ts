import type { HTMLAttributes } from "react";

export type TAppearancePageProps = HTMLAttributes<HTMLDivElement> & {};

export type TSAppearancePageFontProps = {
  fontFamily: string;
  selected?: boolean;
};
