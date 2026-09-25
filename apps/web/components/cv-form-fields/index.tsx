"use client";

import {
  CheckBox,
  DatePickerField,
  Select,
  TextArea,
  TextField,
} from "@costor/ui";
import { useController, useFormContext } from "react-hook-form";
import type { TCvData } from "@/providers/cv-provider/types";
import { NO_AUTOFILL } from "@/utils/no-autofill";
import {
  formatCvDate,
  parseCvDate,
} from "@/components/cv-form-fields/date-utils";
import type {
  TCvCheckBoxProps,
  TCvDateFieldProps,
  TCvFieldName,
  TCvSelectFieldProps,
  TCvTextAreaProps,
  TCvTextFieldProps,
} from "@/components/cv-form-fields/types";

// @costor/ui fields forward their ref to a wrapper, not the input, so they
// are connected with `useController` (controlled) rather than `register`.

const isFilled = (value: unknown) =>
  typeof value === "string" ? value.trim() !== "" : value != null;

const useCvField = (name: TCvFieldName, label: string, required = false) => {
  const { control } = useFormContext<TCvData>();
  const { field, fieldState } = useController({
    control,
    name,
    rules: required
      ? { validate: (value) => isFilled(value) || `${label} is required` }
      : undefined,
  });
  return {
    field,
    errorProps: {
      error: Boolean(fieldState.error),
      helperText: fieldState.error?.message,
    },
  };
};

export const CvTextField = ({
  name,
  label,
  required,
  ...props
}: TCvTextFieldProps) => {
  const { field, errorProps } = useCvField(name, label, required);
  return (
    <TextField
      autoComplete={NO_AUTOFILL}
      {...props}
      {...errorProps}
      label={label}
      required={required}
      name={field.name}
      value={(field.value as string | undefined) ?? ""}
      onChange={(event) => field.onChange(event.target.value)}
      onBlur={field.onBlur}
    />
  );
};

export const CvTextArea = ({
  name,
  label,
  required,
  ...props
}: TCvTextAreaProps) => {
  const { field, errorProps } = useCvField(name, label, required);
  return (
    <TextArea
      autoComplete={NO_AUTOFILL}
      {...props}
      {...errorProps}
      label={label}
      required={required}
      name={field.name}
      value={(field.value as string | undefined) ?? ""}
      onChange={(event) => field.onChange(event.target.value)}
      onBlur={field.onBlur}
    />
  );
};

export const CvCheckBox = ({
  name,
  label,
  required,
  ...props
}: TCvCheckBoxProps) => {
  const { field } = useCvField(name, label, required);
  return (
    <CheckBox
      {...props}
      label={label}
      name={field.name}
      checked={Boolean(field.value)}
      onChange={(event) => field.onChange(event.target.checked)}
      onBlur={field.onBlur}
    />
  );
};

/** Date picker for CV date strings (`YYYY-MM-DD`). */
export const CvDateField = ({
  name,
  label,
  required,
  minDate,
  ...props
}: TCvDateFieldProps) => {
  const { field, errorProps } = useCvField(name, label, required);
  return (
    <DatePickerField
      {...props}
      {...errorProps}
      mode="date"
      label={label}
      required={required}
      name={field.name}
      value={parseCvDate((field.value as string | undefined) ?? "")}
      minDate={minDate ? parseCvDate(minDate) : undefined}
      onChange={(date) => {
        field.onChange(formatCvDate(date));
        field.onBlur();
      }}
    />
  );
};

export const CvSelectField = <T,>({
  name,
  label,
  required,
  ...props
}: TCvSelectFieldProps<T>) => {
  const { field, errorProps } = useCvField(name, label, required);
  return (
    <Select<T>
      {...props}
      {...errorProps}
      label={label}
      required={required}
      value={field.value as T}
      onChange={(_, value) => {
        field.onChange(value);
        field.onBlur();
      }}
    />
  );
};

export type * from "@/components/cv-form-fields/types";
