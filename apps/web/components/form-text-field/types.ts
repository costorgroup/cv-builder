import type { TTextFieldProps } from "@costor/ui";
import type { FieldPath, FieldValues, RegisterOptions } from "react-hook-form";

export type TFormTextFieldProps<TValues extends FieldValues> = Omit<
  TTextFieldProps,
  "name" | "value" | "onChange" | "onBlur" | "error"
> & {
  name: FieldPath<TValues>;
  rules?: RegisterOptions<TValues, FieldPath<TValues>>;
};
