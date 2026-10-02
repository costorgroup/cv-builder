import styled from "@emotion/styled";
import type { TSCvSectionResizerProps } from "@/components/cv-section-resizers/types";

const resizerProps = new Set(["axis", "position"]);

/** How far either side of the line the handle can be grabbed, in px. */
const HIT_AREA = 12;

/** Over the page; the handles show while the page is hovered. */
export const SCvSectionResizers = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`;

/**
 * A boundary between two sections, dragged to resize them: a line across the
 * page with a grip in the middle. Faint while the page is hovered, solid when
 * the handle is hovered, dragged or focused.
 */
export const SCvSectionResizer = styled("div", {
  shouldForwardProp: (prop) => !resizerProps.has(prop),
})<TSCvSectionResizerProps>`
  ${({ theme, axis, position }) => {
    // Horizontal groups sit side by side, so their boundary is upright.
    const upright = axis === "horizontal";
    return `
      position: absolute;
      ${
        upright
          ? `top: 0; bottom: 0; left: ${position}%; width: ${HIT_AREA * 2}px; transform: translateX(-50%); cursor: col-resize;`
          : `left: 0; right: 0; top: ${position}%; height: ${HIT_AREA * 2}px; transform: translateY(-50%); cursor: row-resize;`
      }
      z-index: 1;
      pointer-events: auto;
      touch-action: none;
      outline: none;
      opacity: 0;
      transition: opacity 0.15s ease;

      *:hover > * > & {
        opacity: 0.5;
      }

      &:hover,
      &:focus-visible,
      &[data-dragging] {
        opacity: 1;
      }

      /* The line. */
      &::before {
        content: "";
        position: absolute;
        ${
          upright
            ? "top: 0; bottom: 0; left: 50%; width: 2px; margin-left: -1px;"
            : "left: 0; right: 0; top: 50%; height: 2px; margin-top: -1px;"
        }
        background-color: ${theme.palette.primary.main};
      }

      /* The grip. */
      &::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        ${upright ? "width: 8px; height: 32px;" : "width: 32px; height: 8px;"}
        transform: translate(-50%, -50%);
        border-radius: 4px;
        background-color: ${theme.palette.primary.main};
        box-shadow: 0 0 0 2px ${theme.palette.common.white};
      }

      &:focus-visible::after {
        box-shadow:
          0 0 0 2px ${theme.palette.common.white},
          0 0 0 4px ${theme.palette.primary.main};
      }

      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;
  }}
`;
