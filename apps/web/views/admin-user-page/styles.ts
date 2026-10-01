import styled from "@emotion/styled";
import { Flex } from "@costor/ui";

export const SAdminUserPage = styled(Flex)`
  width: 100%;
  max-width: 1080px;
`;

/** Label/value pairs, several to a row. */
export const SAdminUserPageFacts = styled.div`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: ${theme.spacing(4)};
  `}
`;

/** The role picker, beside the account actions; never stretched. */
export const SAdminUserPageRole = styled.div`
  width: 160px;
`;
