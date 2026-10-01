import styled from "@emotion/styled";

export const SAdminTemplatesPageName = styled.div`
  ${({ theme }) => `
    display: flex;
    align-items: center;
    gap: ${theme.spacing(3)};
  `}
`;

export const SAdminTemplatesPageThumbnail = styled.div`
  flex: none;
  width: 44px;
`;

/** A field inside a table cell, at a width that suits what it holds. */
export const SAdminTemplatesPageField = styled("div", {
  shouldForwardProp: (prop) => prop !== "width",
})<{ width: number }>`
  width: ${({ width }) => width}px;
`;
