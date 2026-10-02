"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { useCv } from "@/providers/cv-provider/context";
import {
  SCvSectionResizer,
  SCvSectionResizers,
} from "@/components/cv-section-resizers/styles";
import type { TCvSectionResizersProps } from "@/components/cv-section-resizers/types";
import type { TTemplateDirection } from "@/templates/types";
import { getSectionSize } from "@/templates/utils";

/** Percent per arrow key press; with Shift, ten times as much. */
const KEY_STEP = 1;

/** Where the pointer is along the group's axis, in percent of the page. */
const pointerPercent = (
  event: PointerEvent<HTMLElement>,
  axis: TTemplateDirection,
) => {
  const page = event.currentTarget.parentElement?.getBoundingClientRect();
  if (!page) return null;
  return axis === "horizontal"
    ? ((event.clientX - page.left) / page.width) * 100
    : ((event.clientY - page.top) / page.height) * 100;
};

/**
 * Handles on the CV page, one per section boundary, dragged (or moved with
 * the arrow keys) to resize the sections either side.
 */
export const CvSectionResizers = ({ ...props }: TCvSectionResizersProps) => {
  const { template, sizes, setSectionSize } = useCv();
  const [dragging, setDragging] = useState<string>();

  return (
    <SCvSectionResizers {...props}>
      {template.groups.map((group) => {
        let start = 0;

        // The last section of a group always takes what is left.
        return group.sections.slice(0, -1).map((section, index) => {
          const value = getSectionSize(
            sizes,
            group.id,
            section.id,
            section.size.value,
          );
          const sectionStart = start;
          start += value;
          const key = `${group.id}-${section.id}`;
          const next = group.sections[index + 1];
          const resize = (size: number) =>
            setSectionSize(group.id, section.id, Math.round(size));

          const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(key);
          };
          const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
            if (dragging !== key) return;
            const percent = pointerPercent(event, group.direction);
            if (percent !== null) resize(percent - sectionStart);
          };
          const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
            event.currentTarget.releasePointerCapture(event.pointerId);
            setDragging(undefined);
          };
          const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
            const step = event.shiftKey ? KEY_STEP * 10 : KEY_STEP;
            const grow =
              group.direction === "horizontal" ? "ArrowRight" : "ArrowDown";
            const shrink =
              group.direction === "horizontal" ? "ArrowLeft" : "ArrowUp";
            if (event.key === grow) resize(value + step);
            else if (event.key === shrink) resize(value - step);
            else return;
            event.preventDefault();
          };

          return (
            <SCvSectionResizer
              key={key}
              axis={group.direction}
              position={sectionStart + value}
              data-dragging={dragging === key ? "" : undefined}
              role="separator"
              tabIndex={0}
              aria-orientation={
                group.direction === "horizontal" ? "vertical" : "horizontal"
              }
              aria-label={`Resize ${section.label} and ${next?.label ?? "the rest"}`}
              aria-valuenow={value}
              aria-valuemin={section.size.min ?? 0}
              aria-valuemax={section.size.max ?? 100}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onKeyDown={onKeyDown}
            />
          );
        });
      })}
    </SCvSectionResizers>
  );
};

export default CvSectionResizers;
