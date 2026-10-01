import styled from "@emotion/styled";
import NextLink from "next/link";
import { Flex } from "@costor/ui";

export const SAdminUsersPageFilters = styled(Flex)`
  width: 100%;
`;

export const SAdminUsersPageSelect = styled.div`
  width: 160px;
`;

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
