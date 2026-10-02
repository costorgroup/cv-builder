import type { MouseEvent } from "react";
import type { TSelectProps } from "@costor/ui";

/** A choice: its value, and what's shown for it. */
export type TValueSelectOption = { value: string; label: string };

export type TValueSelectProps = Omit<
  TSelectProps<TValueSelectOption>,
  | "options"
  | "value"
  | "defaultValue"
  | "onChange"
  | "multiSelect"
  | "getOptionLabel"
  | "getOptionKey"
  | "isValueEqual"
> & {
  /** Plain strings are their own label. */
  options: readonly (string | TValueSelectOption)[];
  value: string;
  onChange?: (event: MouseEvent<HTMLButtonElement>, value: string) => void;
};
