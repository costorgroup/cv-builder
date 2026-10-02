"use client";

import type { MouseEvent } from "react";
import { Chip, CloseIcon, Select } from "@costor/ui";
import {
  STableFiltersChipRemove,
  STableFiltersChips,
} from "@/components/table-filters/styles";
import type { TTableFilterMultiSelectProps } from "@/components/table-filters/types";
import type { TValueSelectOption } from "@/components/value-select";

const optionLabel = ({ label }: TValueSelectOption) => label;
const optionKey = ({ value }: TValueSelectOption) => value;
const sameOption = (a: TValueSelectOption, b: TValueSelectOption) =>
  a.value === b.value;

/**
 * A filter that takes several values, in the filters dialog: Select, with
 * the plain string values filters keep. The chosen ones show as chips, each
 * with a ✕ to remove it. (A single choice is a ValueSelect.)
 */
export const TableFilterMultiSelect = ({
  label,
  value,
  options,
  onChange,
  placeholder,
  color = "primary",
}: TTableFilterMultiSelectProps) => {
  const chosen = options.filter((option) => value.includes(option.value));

  // Removes it without the click also opening or closing the list.
  const remove = (event: MouseEvent, removed: string) => {
    event.stopPropagation();
    event.preventDefault();
    onChange(value.filter((each) => each !== removed));
  };

  return (
    <Select<TValueSelectOption>
      label={label}
      color={color}
      fullWidth
      multiSelect
      closeOnSelect={false}
      placeholder={placeholder}
      options={options}
      value={chosen}
      getOptionLabel={optionLabel}
      getOptionKey={optionKey}
      isValueEqual={sameOption}
      // Nothing chosen shows the placeholder.
      renderValue={() =>
        chosen.length > 0 ? (
          <STableFiltersChips>
            {chosen.map((option) => (
              <Chip key={option.value} size="xs" variant="solid" color={color}>
                {option.label}
                <STableFiltersChipRemove
                  aria-hidden
                  title={`Remove ${option.label}`}
                  onClick={(event) => remove(event, option.value)}
                >
                  <CloseIcon />
                </STableFiltersChipRemove>
              </Chip>
            ))}
          </STableFiltersChips>
        ) : undefined
      }
      onChange={(_, next) =>
        onChange(
          (Array.isArray(next) ? next : [next]).map((option) => option.value),
        )
      }
    />
  );
};

export default TableFilterMultiSelect;
