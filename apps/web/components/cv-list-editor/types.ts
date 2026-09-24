import type { HTMLAttributes, ReactNode } from "react";
import type { TCvFieldName } from "@/components/cv-form-fields/types";
import type { TCvListItem, TCvListKey } from "@/providers/cv-provider/types";

/** Form path of a field of one entry, e.g. `name("position")`. */
export type TCvListEditorFieldName<K extends TCvListKey> = (
  field: keyof TCvListItem<K> & string,
) => TCvFieldName;

export type TCvListEditorProps<K extends TCvListKey> = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  listKey: K;
  /** Accordion title for an entry; falls back to `newItemLabel`. */
  getSummary: (item: TCvListItem<K>) => string;
  newItemLabel: string;
  addLabel: string;
  emptyText: string;
  /** Fields of one entry; `item` holds its live values. */
  renderFields: (
    item: TCvListItem<K>,
    name: TCvListEditorFieldName<K>,
  ) => ReactNode;
};
