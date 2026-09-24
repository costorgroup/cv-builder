"use client";

import { useState } from "react";
import { Accordion, Button, Flex, Small } from "@costor/ui";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import type { TCvFieldName } from "@/components/cv-form-fields/types";
import { createCvItem } from "@/providers/cv-provider/items";
import type {
  TCvData,
  TCvListItem,
  TCvListKey,
} from "@/providers/cv-provider/types";
import {
  CV_LIST_EDITOR_HANDLE_CLASS,
  SCvListEditorActions,
  SCvListEditorDragGroup,
  SCvListEditorFields,
  SCvListEditorHandle,
  SCvListEditorItem,
  SCvListEditorSummary,
} from "@/components/cv-list-editor/styles";
import type { TCvListEditorProps } from "@/components/cv-list-editor/types";

/**
 * Editable list of CV entries (work experience, skills, ...): one accordion
 * per entry with its fields, add and remove buttons, and drag to reorder.
 * Backed by a react-hook-form field array.
 */
export const CvListEditor = <K extends TCvListKey>({
  listKey,
  getSummary,
  newItemLabel,
  addLabel,
  emptyText,
  renderFields,
  ...props
}: TCvListEditorProps<K>) => {
  const { control } = useFormContext<TCvData>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: listKey as TCvListKey,
    // Entries have their own `id`; don't let the field array overwrite it.
    keyName: "key",
  });
  // `fields` only changes on add/remove/move; the live values come from here.
  const items = (useWatch({ control, name: listKey as TCvListKey }) ??
    []) as TCvListItem<K>[];
  // Only the entry that was just added opens by default.
  const [addedId, setAddedId] = useState<string>();

  const onAdd = () => {
    const item = createCvItem(listKey);
    append(item as never);
    setAddedId(item.id);
  };

  return (
    <Flex direction="column" gap={2.5} {...props}>
      {fields.length === 0 && <Small>{emptyText}</Small>}
      {fields.length > 0 && (
        <SCvListEditorDragGroup
          lockAxis="y"
          color="primary"
          dragHandleSelector={`.${CV_LIST_EDITOR_HANDLE_CLASS}`}
          onDrop={({ removedIndex, addedIndex }) => {
            if (removedIndex !== null && addedIndex !== null) {
              move(removedIndex, addedIndex);
            }
          }}
        >
          {fields.map((field, index) => {
            const item = items[index] ?? (field as unknown as TCvListItem<K>);
            const summary = getSummary(item).trim() || newItemLabel;
            const name = (key: string) =>
              `${listKey}.${index}.${key}` as TCvFieldName;
            return (
              <SCvListEditorItem key={field.key}>
                <Accordion
                  summary={
                    <SCvListEditorSummary>
                      <SCvListEditorHandle
                        className={CV_LIST_EDITOR_HANDLE_CLASS}
                        title="Drag to reorder"
                        aria-hidden
                        // Grabbing the handle shouldn't open or close the entry.
                        onClick={(event) => event.stopPropagation()}
                      />
                      {summary}
                    </SCvListEditorSummary>
                  }
                  defaultExpanded={item.id === addedId}
                  color="primary"
                  variant="subtle"
                  colorScope="summary"
                  radius="xs"
                >
                  <SCvListEditorFields columns={2} gap={2}>
                    {renderFields(item, name)}
                  </SCvListEditorFields>
                  <SCvListEditorActions justify="flex-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      color="error"
                      onClick={() => remove(index)}
                    >
                      Remove
                    </Button>
                  </SCvListEditorActions>
                </Accordion>
              </SCvListEditorItem>
            );
          })}
        </SCvListEditorDragGroup>
      )}
      <Button variant="solid" color="primary" fullWidth onClick={onAdd}>
        {addLabel}
      </Button>
    </Flex>
  );
};

export default CvListEditor;
