"use client";

import { useCallback, useRef, useState } from "react";
import ConfirmModal from "@/components/confirm-modal";
import {
  ConfirmCancelledError,
  ConfirmContext,
} from "@/providers/confirm-provider/context";
import type {
  TConfirm,
  TConfirmProviderProps,
  TPendingConfirm,
} from "@/providers/confirm-provider/types";

/** Renders the one confirmation modal that `useConfirm()` opens. */
export const ConfirmProvider = ({ children }: TConfirmProviderProps) => {
  const [open, setOpen] = useState(false);
  // Kept after closing, so the modal keeps its text while it animates out.
  const [pending, setPending] = useState<TPendingConfirm>();
  const pendingRef = useRef<TPendingConfirm>(undefined);

  const settle = useCallback((confirmed: boolean) => {
    const current = pendingRef.current;
    pendingRef.current = undefined;
    setOpen(false);
    if (!current) return;
    if (confirmed) current.resolve();
    else current.reject(new ConfirmCancelledError());
  }, []);

  const confirm = useCallback<TConfirm>(
    (options) =>
      new Promise<void>((resolve, reject) => {
        // A new question replaces one still open; that one counts as cancelled.
        pendingRef.current?.reject(new ConfirmCancelledError());
        const next = { options, resolve, reject };
        pendingRef.current = next;
        setPending(next);
        setOpen(true);
      }),
    [],
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <ConfirmModal
          {...pending.options}
          open={open}
          onConfirm={() => settle(true)}
          onCancel={() => settle(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
};

export {
  ConfirmCancelledError,
  isConfirmCancelled,
  useConfirm,
} from "@/providers/confirm-provider/context";
export type { TConfirm } from "@/providers/confirm-provider/types";
