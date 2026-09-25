"use client";

import { createContext, useContext } from "react";
import type { TConfirm } from "@/providers/confirm-provider/types";

/** Why `confirm()` rejected: the user cancelled or closed the modal. */
export class ConfirmCancelledError extends Error {
  constructor() {
    super("Cancelled by the user");
    this.name = "ConfirmCancelledError";
  }
}

export const isConfirmCancelled = (
  error: unknown,
): error is ConfirmCancelledError => error instanceof ConfirmCancelledError;

export const ConfirmContext = createContext<TConfirm | null>(null);

/**
 * Asks for confirmation before going on:
 *
 *   try {
 *     await confirm({ title: "Remove this entry?", color: "error" });
 *   } catch {
 *     return; // cancelled
 *   }
 *   remove();
 */
export const useConfirm = () => {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirm must be used inside a ConfirmProvider");
  }
  return confirm;
};
