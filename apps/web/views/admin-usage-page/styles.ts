import styled from "@emotion/styled";

/** The two "most" lists side by side where there's room. */
export const SAdminUsagePageTables = styled.div`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${theme.spacing(5)};

    ${theme.breakpoints.down("lg")} {
      grid-template-columns: minmax(0, 1fr);
    }
  `}
`;
