import styled from "@emotion/styled";

/** Checkboxes and limit rows, two columns where there's room. */
export const SEntitlementsEditorGrid = styled.div`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${theme.spacing(3, 6)};

    ${theme.breakpoints.down("md")} {
      grid-template-columns: minmax(0, 1fr);
    }
  `}
`;

export const SEntitlementsEditorLimit = styled.div`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: minmax(0, 1fr) 140px auto;
    align-items: center;
    gap: ${theme.spacing(3)};
  `}
`;
