"use client";

import { useState } from "react";
import { Accordion, AccordionGroup, IconButton } from "@costor/ui";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import type { TCvFieldName } from "@/components/cv-form-fields/types";
import { DuplicateIcon, TrashIcon } from "@/components/cv-list-editor/icons";
import {
  SCvListEditorEmpty,
  SCvListEditorFields,
} from "@/components/cv-list-editor/styles";
import type { TCvListEditorProps } from "@/components/cv-list-editor/types";
import { useConfirm } from "@/providers/confirm-provider";
import { createCvItem } from "@/providers/cv-provider/items";
import type {
  TCvData,
  TCvListItem,
  TCvListKey,
} from "@/providers/cv-provider/types";

/**
 * Editable list of CV entries (work experience, skills, ...) as an accordion
 * group: one entry open at a time, duplicate and remove on hover, a grip to
 * drag it and a "+" row to add one. Backed by a react-hook-form field array.
 */
export const CvListEditor = <K extends TCvListKey>({
  listKey,
  getSummary,
  newItemLabel,
  addLabel,
  emptyTitle,
  emptyDescription,
  renderFields,
  ...props
}: TCvListEditorProps<K>) => {
  const { control } = useFormContext<TCvData>();
  const { fields, append, insert, remove, move } = useFieldArray({
    control,
    name: listKey as TCvListKey,
    // Entries have their own `id`; don't let the field array overwrite it.
    keyName: "key",
  });
  // `fields` only changes on add/remove/move; the live values come from here.
  const items = (useWatch({ control, name: listKey as TCvListKey }) ??
    []) as TCvListItem<K>[];
  // The entry whose fields are showing; a new or duplicated one opens.
  const [openId, setOpenId] = useState<string | null>(null);
  const confirm = useConfirm();

  const onAdd = () => {
    const item = createCvItem(listKey);
    append(item as never);
    setOpenId(item.id);
  };

  const onDuplicate = (item: TCvListItem<K>, index: number) => {
    const copy = { ...item, id: createCvItem(listKey).id };
    insert(index + 1, copy as never);
    setOpenId(copy.id);
  };

  const onRemove = async (summary: string, index: number) => {
    try {
      await confirm({
        title: `Remove "${summary}"?`,
        description: "It will be removed from this CV.",
        confirmLabel: "Remove",
        color: "error",
      });
    } catch {
      return; // Cancelled.
    }
    remove(index);
  };

  return (
    <AccordionGroup
      variant="outline"
      color="default"
      colorScope="none"
      value={openId}
      onValueChange={(_, value) => setOpenId(value)}
      onReorder={move}
      onAdd={onAdd}
      addLabel={addLabel}
      empty={
        <SCvListEditorEmpty>
          <strong>{emptyTitle}</strong>
          {emptyDescription}
        </SCvListEditorEmpty>
      }
      {...props}
    >
      {fields.map((field, index) => {
        const item = items[index] ?? (field as unknown as TCvListItem<K>);
        const summary = getSummary(item).trim() || newItemLabel;
        const name = (key: string) =>
          `${listKey}.${index}.${key}` as TCvFieldName;
        return (
          <Accordion
            key={field.key}
            value={item.id}
            summary={summary}
            actionsVisibility="hover"
            actions={
              <>
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label={`Duplicate ${summary}`}
                  title="Duplicate"
                  onClick={() => onDuplicate(item, index)}
                >
                  <DuplicateIcon />
                </IconButton>
                <IconButton
                  size="sm"
                  variant="ghost"
                  color="error"
                  aria-label={`Remove ${summary}`}
                  title="Remove"
                  onClick={() => onRemove(summary, index)}
                >
                  <TrashIcon />
                </IconButton>
              </>
            }
          >
            <SCvListEditorFields columns={2} gap={2}>
              {renderFields(item, name)}
            </SCvListEditorFields>
          </Accordion>
        );
      })}
    </AccordionGroup>
  );
};

export default CvListEditor;
