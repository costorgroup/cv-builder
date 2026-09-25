import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

export type TAuthFormProps<TValues extends FieldValues> = {
  title: string;
  description?: ReactNode;
  form: UseFormReturn<TValues>;
  onSubmit: (values: TValues) => Promise<void>;
  submitLabel: string;
  /** Links under the form, e.g. to switch between sign in and sign up. */
  footer?: ReactNode;
  children: ReactNode;
};
