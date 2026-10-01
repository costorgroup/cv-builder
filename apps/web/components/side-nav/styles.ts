import styled from "@emotion/styled";
import { Button, Card } from "@costor/ui";

/** Stays in view beside the page as it scrolls, on larger screens. */
export const SSideNav = styled.nav`
  ${({ theme }) => `
    position: sticky;
    top: ${theme.spacing(5)};
    min-width: 0;

    ${theme.breakpoints.down("md")} {
      position: static;
    }
  `}
`;

/** A card of links; a scrolling row on small screens. */
export const SSideNavCard = styled(Card)`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(3)};

    ${theme.breakpoints.down("md")} {
      flex-direction: row;
      overflow-x: auto;
      padding: ${theme.spacing(2)};
    }
  `}
`;

export const SSideNavItem = styled(Button)`
  ${({ theme }) => `
    justify-content: flex-start;
    gap: ${theme.spacing(2.5)};
    flex-shrink: 0;

    ${theme.breakpoints.down("md")} {
      width: auto;
    }
  `}
`;
