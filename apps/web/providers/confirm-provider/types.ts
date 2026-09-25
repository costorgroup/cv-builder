import type { ReactNode } from "react";
import type { TConfirmOptions } from "@/components/confirm-modal/types";

/** Resolves when confirmed; rejects with `ConfirmCancelledError` otherwise. */
export type TConfirm = (options: TConfirmOptions) => Promise<void>;

export type TConfirmProviderProps = {
  children: ReactNode;
};

/** The confirmation on screen and how to settle its promise. */
export type TPendingConfirm = {
  options: TConfirmOptions;
  resolve: () => void;
  reject: (error: Error) => void;
};
