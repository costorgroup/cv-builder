import type { ReactNode } from "react";
import type { TPaletteColor } from "@costor/ui";
import type { TValueSelectOption } from "@/components/value-select";

export type TTableFiltersValues = Record<string, unknown>;

export type TTableFilterMultiSelectProps = {
  label: ReactNode;
  /** The chosen values; none usually means "any". */
  value: string[];
  options: TValueSelectOption[];
  onChange: (value: string[]) => void;
  /** Shown when nothing is chosen, e.g. "Every action". */
  placeholder?: string;
  /** The field's color, and its chips'; primary by default, as Select's. */
  color?: TPaletteColor;
};

export type TTableFiltersProps<T extends TTableFiltersValues> = {
  /** The filters in use. */
  value: T;
  /**
   * The page's starting filters, usually none; what "Clear" goes back to.
   * A filter counts as on when it differs from this.
   */
  defaultValue: T;
  /** Called with the new filters on "Apply" (or "Clear"). */
  onChange: (value: T) => void;
  /** The fields, given the filters being edited and a way to change them. */
  children: (draft: T, update: (change: Partial<T>) => void) => ReactNode;
  /** The dialog's title; "Filters" by default. */
  title?: ReactNode;
  description?: ReactNode;
};
