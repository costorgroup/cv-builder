import type { ReactNode } from "react";
import type { TPaletteColor } from "@costor/ui";

/** What a confirmation asks; everything but the title is optional. */
export type TConfirmOptions = {
  title: ReactNode;
  description?: ReactNode;
  /** Defaults to "Confirm". */
  confirmLabel?: ReactNode;
  /** Defaults to "Cancel". */
  cancelLabel?: ReactNode;
  /** Color of the confirm button, e.g. `error` for deleting. */
  color?: TPaletteColor;
};

export type TConfirmModalProps = TConfirmOptions & {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};
