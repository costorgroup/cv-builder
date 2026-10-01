import styled from "@emotion/styled";
import { Flex } from "@costor/ui";

export const SAdminPlanPageFields = styled(Flex)`
  width: 100%;
  max-width: 520px;
`;

/** A field in the add-price row, at a width that suits what it holds. */
export const SAdminPlanPagePriceField = styled("div", {
  shouldForwardProp: (prop) => prop !== "width",
})<{ width: number }>`
  width: ${({ width }) => width}px;
`;
