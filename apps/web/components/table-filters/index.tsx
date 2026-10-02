"use client";

import { useState } from "react";
import { Badge, Button, IconButton, Modal } from "@costor/ui";
import {
  STableFiltersFields,
  STableFiltersIcon,
} from "@/components/table-filters/styles";
import type {
  TTableFiltersProps,
  TTableFiltersValues,
} from "@/components/table-filters/types";

/** @costor/ui has no filter icon yet. */
const FilterIcon = () => (
  <STableFiltersIcon
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M3 5h18l-7 8.5V19l-4 2v-7.5L3 5z" />
  </STableFiltersIcon>
);

/** Equal filter values; lists (e.g. of actions) by what's in them. */
const sameValue = (a: unknown, b: unknown) =>
  Array.isArray(a) && Array.isArray(b)
    ? a.length === b.length && a.every((each) => b.includes(each))
    : a === b;

/** How many filters differ from the page's starting ones. */
const countActive = <T extends TTableFiltersValues>(value: T, defaults: T) =>
  Object.keys(defaults).filter((key) => !sameValue(value[key], defaults[key]))
    .length;

/**
 * A DataTable's filters, as one of its actions: a button showing how many
 * are on, opening a dialog to change them. Changes apply on "Apply".
 */
export const TableFilters = <T extends TTableFiltersValues>({
  value,
  defaultValue,
  onChange,
  children,
  title = "Filters",
  description,
}: TTableFiltersProps<T>) => {
  const [draft, setDraft] = useState<T>();
  const active = countActive(value, defaultValue);
  const close = () => setDraft(undefined);
  const apply = (next: T) => {
    onChange(next);
    close();
  };

  return (
    <>
      <Badge
        badgeContent={active}
        invisible={active === 0}
        color="primary"
        variant="solid"
        size="sm"
      >
        <IconButton
          size="sm"
          color="default"
          aria-label={active > 0 ? `Filters (${active} on)` : "Filters"}
          onClick={() => setDraft(value)}
        >
          <FilterIcon />
        </IconButton>
      </Badge>
      <Modal
        open={draft !== undefined}
        onClose={close}
        size="sm"
        title={title}
        description={description}
        actions={
          <>
            <Button
              variant="ghost"
              disabled={!draft || countActive(draft, defaultValue) === 0}
              onClick={() => apply(defaultValue)}
            >
              Clear
            </Button>
            <Button onClick={close}>Cancel</Button>
            <Button
              variant="solid"
              color="primary"
              onClick={() => draft && apply(draft)}
            >
              Apply
            </Button>
          </>
        }
      >
        {draft && (
          <STableFiltersFields>
            {children(draft, (change) =>
              setDraft((current) => current && { ...current, ...change }),
            )}
          </STableFiltersFields>
        )}
      </Modal>
    </>
  );
};

export default TableFilters;
export { TableFilterMultiSelect } from "@/components/table-filters/select";

