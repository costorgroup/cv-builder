"use client";

import { useCv } from "@/providers/cv-provider/context";
import {
  SCvSectionResizer,
  SCvSectionResizers,
} from "@/components/cv-section-resizers/styles";
import type { TCvSectionResizersProps } from "@/components/cv-section-resizers/types";
import { getSectionSize } from "@/templates/utils";

/**
 * Sliders laid over the CV page, one per section boundary. Horizontal groups
 * get a slider on the top edge, vertical groups on the left edge.
 */
export const CvSectionResizers = ({ ...props }: TCvSectionResizersProps) => {
  const { template, sizes, setSectionSize } = useCv();

  return (
    <SCvSectionResizers {...props}>
      {template.groups.map((group) => {
        let offset = 0;

        // The last section of a group always takes what is left.
        return group.sections.slice(0, -1).map((section) => {
          const min = section.size.min ?? 0;
          const max = section.size.max ?? 100;
          const value = getSectionSize(
            sizes,
            group.id,
            section.id,
            section.size.value,
          );
          const start = offset + min;
          offset += value;

          // Vertical ranges grow from the bottom, but sections are measured
          // from the top, so the value is mirrored.
          const vertical = group.direction === "vertical";
          const toRange = (size: number) =>
            vertical ? min + max - size : size;

          return (
            <SCvSectionResizer
              key={`${group.id}-${section.id}`}
              axis={group.direction}
              start={start}
              length={max - min}
              direction={group.direction}
              track={false}
              size="sm"
              color="primary"
              min={min}
              max={max}
              step={1}
              value={toRange(value)}
              // `null` would fall back to the default value label; `false` renders none.
              renderValue={() => false}
              onChange={(_, next) =>
                typeof next === "number" &&
                setSectionSize(group.id, section.id, toRange(next))
              }
            />
          );
        });
      })}
    </SCvSectionResizers>
  );
};

export default CvSectionResizers;
