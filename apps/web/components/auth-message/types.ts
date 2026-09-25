import type { ReactNode } from "react";

export type TAuthMessageProps = {
  title: string;
  children?: ReactNode;
  /** Actions or links under the message. */
  footer?: ReactNode;
};
