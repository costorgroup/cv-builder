import styled from "@emotion/styled";

/** Above the side nav's links; first in the row on small screens. */
export const SWorkspaceSwitcher = styled.div`
  ${({ theme }) => `
    margin-bottom: ${theme.spacing(2)};

    ${theme.breakpoints.down("md")} {
      flex-shrink: 0;
      width: 180px;
      margin-bottom: 0;
    }
  `}
`;
