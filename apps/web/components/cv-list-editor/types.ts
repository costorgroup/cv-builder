import type { HTMLAttributes, ReactNode } from "react";
import type { TCvFieldName } from "@/components/cv-form-fields/types";
import type { TCvListItem, TCvListKey } from "@/providers/cv-provider/types";

/** Form path of a field of one entry, e.g. `name("position")`. */
export type TCvListEditorFieldName<K extends TCvListKey> = (
  field: keyof TCvListItem<K> & string,
) => TCvFieldName;

export type TCvListEditorProps<K extends TCvListKey> = Omit<
  HTMLAttributes<HTMLDivElement>,
  // Taken by AccordionGroup with other meanings.
  "children" | "color" | "defaultValue"
> & {
  listKey: K;
  /** Row title for an entry; falls back to `newItemLabel`. */
  getSummary: (item: TCvListItem<K>) => string;
  newItemLabel: string;
  /** Accessible name of the "+" row. */
  addLabel: string;
  /** Shown above the "+" row while the list has no entries. */
  emptyTitle: string;
  emptyDescription: string;
  /** Fields of one entry; `item` holds its live values. */
  renderFields: (
    item: TCvListItem<K>,
    name: TCvListEditorFieldName<K>,
  ) => ReactNode;
};
