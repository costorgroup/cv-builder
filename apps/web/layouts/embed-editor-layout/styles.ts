import styled from "@emotion/styled";

/** The customer's logo (or initials) where our logo goes. */
export const SEmbedEditorLayoutBrand = styled.div`
  ${({ theme }) => `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    overflow: hidden;
    border-radius: ${theme.radius.sm};
    background-color: ${theme.palette.primary.main};
    color: ${theme.palette.primary.contrastText};
    font-weight: ${theme.typography.fontWeight.bold};
    text-transform: uppercase;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background-color: ${theme.surfaces.background};
    }
  `}
`;
