import type { HTMLAttributes } from "react";

export type TWideTableProps = HTMLAttributes<HTMLDivElement> & {
  /** Narrower than this, the table scrolls sideways inside its card. */
  minWidth: number;
};

export type TSWideTableProps = Pick<TWideTableProps, "minWidth">;
