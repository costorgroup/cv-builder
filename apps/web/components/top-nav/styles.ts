import styled from "@emotion/styled";
import { Card } from "@costor/ui";

/** Bar height in px; the site layout offsets full-bleed content by it. */
export const TOP_NAV_HEIGHT = 80;
export const TOP_NAV_HEIGHT_SM = 64;

/** The top bar: logo | title & description | tools | theme & account. */
export const STopNav = styled(Card)`
  ${({ theme }) => `
    padding: 0;
    width: 100%;
    height: ${TOP_NAV_HEIGHT}px;
    flex-shrink: 0;
    display: grid;
    grid-template-columns: ${TOP_NAV_HEIGHT}px auto minmax(0, 1fr) auto;
    gap: 0;

    ${theme.breakpoints.down("md")} {
      grid-template-columns: ${TOP_NAV_HEIGHT}px minmax(0, 1fr) auto;
    }

    ${theme.breakpoints.down("sm")} {
      height: ${TOP_NAV_HEIGHT_SM}px;
      grid-template-columns: ${TOP_NAV_HEIGHT_SM}px minmax(0, 1fr) auto;
    }
  `}
`;

export const STopNavBrand = styled.div`
  ${({ theme }) => `
    display: flex;
    align-items: center;
    justify-content: center;
    width: ${TOP_NAV_HEIGHT}px;
    height: ${TOP_NAV_HEIGHT}px;
    border-right: 1px solid ${theme.surfaces.divider};

    ${theme.breakpoints.down("sm")} {
      width: ${TOP_NAV_HEIGHT_SM}px;
      height: ${TOP_NAV_HEIGHT_SM}px;
    }
  `}
`;

export const STopNavHeader = styled.div`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    padding: ${theme.spacing(0, 4)};

    ${theme.breakpoints.down("md")} {
      display: none;
    }
  `}
`;

/** Page tools, on the left after the title. */
export const STopNavTools = styled.div`
  ${({ theme }) => `
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2)};
    min-width: 0;
    padding: ${theme.spacing(0, 4)};
    border-left: 1px solid ${theme.surfaces.divider};

    ${theme.breakpoints.down("md")} {
      border-left: none;
    }

    ${theme.breakpoints.down("sm")} {
      padding: ${theme.spacing(0, 2)};
    }
  `}
`;

export const STopNavActions = styled.div`
  ${({ theme }) => `
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2)};
    padding: ${theme.spacing(0, 4)};

    ${theme.breakpoints.down("sm")} {
      gap: ${theme.spacing(1)};
      padding: ${theme.spacing(0, 2)};
    }
  `}
`;
