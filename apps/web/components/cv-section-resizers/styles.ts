import styled from "@emotion/styled";
import { InputRangeField } from "@costor/ui";
import type { TSCvSectionResizerProps } from "@/components/cv-section-resizers/types";

const resizerProps = new Set(["axis", "start", "length"]);

/** Gap between the page edge and the slider rail, in px. */
export const CV_SECTION_RESIZER_OFFSET = 20;

export const SCvSectionResizers = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`;

// The rail spans exactly [start, start + length] of the page, so the thumb
// sits on the section boundary. `&&` beats InputRangeField's own sizing.
export const SCvSectionResizer = styled(InputRangeField, {
  shouldForwardProp: (prop) => !resizerProps.has(prop),
})<TSCvSectionResizerProps>`
  ${({ axis, start, length }) =>
    axis === "horizontal"
      ? `
    && {
      position: absolute;
      top: -${CV_SECTION_RESIZER_OFFSET}px;
      left: ${start}%;
      width: ${length}%;
      transform: translateY(-50%);
      pointer-events: auto;
    }
  `
      : `
    && {
      position: absolute;
      left: -${CV_SECTION_RESIZER_OFFSET}px;
      top: ${start}%;
      height: ${length}%;
      transform: translateX(-50%);
      pointer-events: auto;
    }
  `}
`;
