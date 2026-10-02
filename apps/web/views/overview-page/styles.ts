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

/** The greeting, and a line about the page under it. */
export const SOverviewPageIntro = styled.div`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
  `}
`;

/** A stat: its icon on a tile, then the label, value and the rest. */
export const SOverviewPageStat = styled(Card)`
  ${({ theme }) => `
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: ${theme.spacing(4)};
    padding: ${theme.spacing(5)};
    min-width: 0;
  `}
`;

export const SOverviewPageStatIcon = styled.span`
  ${({ theme }) => `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: ${theme.radius.md};
    background-color: color-mix(in srgb, ${theme.palette.primary.main} 12%, transparent);
    color: ${theme.palette.primary.main};

    svg {
      width: 22px;
      height: 22px;
    }
  `}
`;

export const SOverviewPageStatBody = styled.div`
  ${({ theme }) => `
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: ${theme.spacing(1.5)};
    min-width: 0;
  `}
`;

/** A stat's action, a little apart from the value. */
export const SOverviewPageStatAction = styled.div`
  ${({ theme }) => `
    margin-top: ${theme.spacing(1)};
  `}
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
