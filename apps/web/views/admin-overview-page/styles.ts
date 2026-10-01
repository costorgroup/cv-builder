import styled from "@emotion/styled";
import { Card } from "@costor/ui";

export const SAdminOverviewPage = styled.div`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: ${theme.spacing(4)};

    ${theme.breakpoints.down("lg")} {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    ${theme.breakpoints.down("sm")} {
      grid-template-columns: minmax(0, 1fr);
    }
  `}
`;

export const SAdminOverviewPageStat = styled(Card)`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1.5)};
    padding: ${theme.spacing(5)};
    min-width: 0;
  `}
`;
