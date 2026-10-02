"use client";

import { useMemo } from "react";
import { Select } from "@costor/ui";
import type {
  TValueSelectOption,
  TValueSelectProps,
} from "@/components/value-select/types";

const optionLabel = ({ label }: TValueSelectOption) => label;
const optionKey = ({ value }: TValueSelectOption) => value;
const sameOption = (a: TValueSelectOption, b: TValueSelectOption) =>
  a.value === b.value;

/**
 * Select for a plain string value, with options as `{ value, label }` (or
 * strings) — the app's dropdown, in place of the native one. `aria-label`
 * names the button that opens it.
 */
export const ValueSelect = ({
  options,
  value,
  onChange,
  slotProps,
  "aria-label": ariaLabel,
  ...props
}: TValueSelectProps) => {
  const choices = useMemo(
    () =>
      options.map((option) =>
        typeof option === "string" ? { value: option, label: option } : option,
      ),
    [options],
  );
  return (
    <Select<TValueSelectOption>
      {...props}
      slotProps={
        ariaLabel
          ? {
              ...slotProps,
              trigger: { "aria-label": ariaLabel, ...slotProps?.trigger },
            }
          : slotProps
      }
      options={choices}
      value={choices.find((choice) => choice.value === value)}
      getOptionLabel={optionLabel}
      getOptionKey={optionKey}
      isValueEqual={sameOption}
      onChange={(event, choice) => {
        if (!Array.isArray(choice)) onChange?.(event, choice.value);
      }}
    />
  );
};

export default ValueSelect;
export type * from "@/components/value-select/types";
