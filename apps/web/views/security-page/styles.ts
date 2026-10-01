import styled from "@emotion/styled";
import { Flex } from "@costor/ui";

export const SSecurityPage = styled(Flex)`
  width: 100%;
  max-width: 880px;
`;

/** One signed-in device: what it is and when it was used, and sign out. */
export const SSecurityPageSession = styled(Flex)`
  ${({ theme }) => `
    padding: ${theme.spacing(3, 0)};
    border-top: 1px solid ${theme.surfaces.divider};

    &:first-of-type {
      border-top: none;
      padding-top: 0;
    }
  `}
`;

export const SSecurityPageSessionText = styled(Flex)`
  min-width: 0;
  flex: 1;
`;
