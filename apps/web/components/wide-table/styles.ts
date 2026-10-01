import styled from "@emotion/styled";
import type { TSWideTableProps } from "@/components/wide-table/types";

export const SWideTable = styled("div", {
  shouldForwardProp: (prop) => prop !== "minWidth",
})<TSWideTableProps>`
  min-width: 0;

  table {
    min-width: ${({ minWidth }) => minWidth}px;
  }
`;
