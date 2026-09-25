"use client";

import { TextField } from "@costor/ui";
import { useController, useFormContext } from "react-hook-form";
import type { FieldValues } from "react-hook-form";
import type { TFormTextFieldProps } from "@/components/form-text-field/types";

/**
 * A TextField bound to the surrounding react-hook-form form. Connected with
 * `useController` since @costor/ui doesn't forward its ref to the input.
 */
export const FormTextField = <TValues extends FieldValues>({
  name,
  rules,
  helperText,
  ...props
}: TFormTextFieldProps<TValues>) => {
  const { control } = useFormContext<TValues>();
  const { field, fieldState } = useController({ control, name, rules });
  return (
    <TextField
      {...props}
      name={field.name}
      value={(field.value as string | undefined) ?? ""}
      onChange={(event) => field.onChange(event.target.value)}
      onBlur={field.onBlur}
      error={Boolean(fieldState.error)}
      helperText={fieldState.error?.message ?? helperText}
    />
  );
};

export default FormTextField;
