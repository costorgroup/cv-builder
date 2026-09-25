"use client";

import { Button, Modal } from "@costor/ui";
import type { TConfirmModalProps } from "@/components/confirm-modal/types";

/**
 * Asks the user to confirm an action. Closing it (Escape, backdrop, ✕)
 * counts as cancelling. Usually opened through `useConfirm()`.
 */
export const ConfirmModal = ({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  color = "primary",
  onConfirm,
  onCancel,
}: TConfirmModalProps) => (
  <Modal
    open={open}
    onClose={onCancel}
    size="sm"
    title={title}
    description={description}
    actions={
      <>
        <Button onClick={onCancel}>{cancelLabel}</Button>
        <Button variant="solid" color={color} onClick={onConfirm} autoFocus>
          {confirmLabel}
        </Button>
      </>
    }
  />
);

export default ConfirmModal;
export type { TConfirmOptions } from "@/components/confirm-modal/types";
