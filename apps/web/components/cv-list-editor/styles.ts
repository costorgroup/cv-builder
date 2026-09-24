import styled from "@emotion/styled";
import { DragGroup, DragItem, Flex, Grid } from "@costor/ui";

/** Class of the grip that starts a drag; `DragGroup` only drags from it. */
export const CV_LIST_EDITOR_HANDLE_CLASS = "cv-list-editor-handle";

/**
 * AccordionGroup only rounds the outer corners of accordions that are its
 * direct children; here each one sits inside a DragItem, so the same rules
 * are applied one level down.
 */
export const SCvListEditorDragGroup = styled(DragGroup)`
  ${({ theme }) => `
    width: 100%;
    display: flex;
    gap: ${theme.spacing(2.5)};
  `}
`;

export const SCvListEditorItem = styled(DragItem)``;

export const SCvListEditorSummary = styled.span`
  ${({ theme }) => `
    display: inline-flex;
    align-items: center;
    gap: ${theme.spacing(2)};
    min-width: 0;
  `}
`;

/** Six-dot grip drawn with a repeating dot gradient. */
export const SCvListEditorHandle = styled.span`
  flex-shrink: 0;
  width: 10px;
  height: 16px;
  opacity: 0.6;
  cursor: grab;
  touch-action: none;
  background-image: radial-gradient(
    circle,
    currentColor 1.3px,
    transparent 1.6px
  );
  background-size: 5px 5.33px;

  &:hover {
    opacity: 1;
  }

  &:active {
    cursor: grabbing;
  }
`;

export const SCvListEditorFields = styled(Grid)`
  padding: ${({ theme }) => theme.spacing(2.5)} 0;
`;

export const SCvListEditorActions = styled(Flex)`
  padding-bottom: ${({ theme }) => theme.spacing(2.5)};
`;
