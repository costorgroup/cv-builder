import styled from "@emotion/styled";
import { Card, Flex } from "@costor/ui";

export const SOverviewPage = styled(Flex)`
  width: 100%;
`;

/** Plan and usage, side by side where there's room. */
export const SOverviewPageStats = styled.div`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: ${theme.spacing(4)};

    ${theme.breakpoints.down("lg")} {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    ${theme.breakpoints.down("sm")} {
      grid-template-columns: minmax(0, 1fr);
    }
  `}
`;

export const SOverviewPageStat = styled(Card)`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
    padding: ${theme.spacing(5)};
    min-width: 0;
  `}
`;

/** Pushes a stat's action to the bottom of its card. */
export const SOverviewPageStatAction = styled.div`
  margin-top: auto;
`;

export const SOverviewPageSectionHeader = styled(Flex)`
  width: 100%;
`;

/** The latest CVs: one row, fewer columns on smaller screens. */
export const SOverviewPageRecent = styled.div`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: ${theme.spacing(4)};

    ${theme.breakpoints.down("xl")} {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    ${theme.breakpoints.down("lg")} {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    ${theme.breakpoints.down("md")} {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `}
`;
