import styled from "@emotion/styled";

/** The bucket's fields, two to a row where there's room. */
export const SStoragePageFields = styled.div`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${theme.spacing(3)} ${theme.spacing(4)};

    ${theme.breakpoints.down("sm")} {
      grid-template-columns: minmax(0, 1fr);
    }
  `}
`;
