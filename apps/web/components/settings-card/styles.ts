import styled from "@emotion/styled";
import { Card, Flex } from "@costor/ui";

export const SSettingsCard = styled(Card)`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(5)};
    padding: ${theme.spacing(6)};
    width: 100%;

    ${theme.breakpoints.down("sm")} {
      padding: ${theme.spacing(4)};
    }
  `}
`;

export const SSettingsCardHeader = styled(Flex)`
  min-width: 0;
`;

export const SSettingsCardActions = styled(Flex)`
  justify-content: flex-end;
`;

/** Fields in a column, at a width that reads well. */
export const SSettingsCardFields = styled(Flex)`
  width: 100%;
  max-width: 520px;
`;
