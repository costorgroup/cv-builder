import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

export type TSettingsCardProps = {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** Buttons at the bottom right. */
  actions?: ReactNode;
  /** Red title, for things like deleting the account. */
  danger?: boolean;
};

export type TSettingsFormProps<TValues extends FieldValues> = Omit<
  TSettingsCardProps,
  "actions"
> & {
  form: UseFormReturn<TValues>;
  /** Resolves to a message to show once it worked, if any. */
  onSubmit: (values: TValues) => Promise<string | void>;
  submitLabel: string;
  /** Keeps the button disabled until a field changes. */
  requireChanges?: boolean;
  /** Empties the fields once it worked (e.g. passwords), instead of keeping them. */
  clearOnSuccess?: boolean;
};
