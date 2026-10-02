import styled from "@emotion/styled";
import NextLink from "next/link";

export const SAdminUsersPageLink = styled(NextLink)`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    color: inherit;
    text-decoration: none;

    &:hover strong {
      color: ${theme.palette.primary.main};
    }
  `}
`;
