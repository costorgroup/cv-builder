import styled from "@emotion/styled";
import {
  Card,
  ScrollArea,
  sidebarClasses,
  sidebarItemDescriptionClasses,
  sidebarSeparatorClasses,
} from "@costor/ui";

/** As tall as the page beside it, on larger screens. */
export const SSideNav = styled.nav`
  ${({ theme }) => `
    min-width: 0;
    height: 100%;

    ${theme.breakpoints.down("md")} {
      height: auto;
    }
  `}
`;

/** The editor card's sizes: the rail and its header and footer rows. */
const RAIL_WIDTH = 80;
const HEADER_HEIGHT = 80;

/** The group rail and the open group's pages, side by side. */
export const SSideNavCard = styled(Card)`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: ${RAIL_WIDTH}px minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 0;
    height: 100%;
    padding: 0;

    ${theme.breakpoints.down("md")} {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto;
    }
  `}
`;

/** Icons only, one per group; a scrolling row on small screens. */
export const SSideNavRail = styled.div`
  ${({ theme }) => `
    min-height: 0;
    overflow-y: auto;
    padding: ${theme.spacing(4)};
    border-right: 1px solid ${theme.surfaces.divider};

    .${sidebarClasses.root} {
      align-items: center;
    }

    ${theme.breakpoints.down("md")} {
      overflow-x: auto;
      overflow-y: visible;
      border-right: none;
      border-bottom: 1px solid ${theme.surfaces.divider};

      .${sidebarClasses.root} {
        flex-direction: row;
      }

      .${sidebarSeparatorClasses.root} {
        display: none;
      }
    }
  `}
`;

/** The open group: its header above, its pages scrolling below. */
export const SSideNavPanel = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
`;

/** The open group's name and what it's for, split from its pages. */
export const SSideNavPanelHeader = styled.div`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex-shrink: 0;
    height: ${HEADER_HEIGHT}px;
    padding: ${theme.spacing(4)};
    border-bottom: 1px solid ${theme.surfaces.divider};
  `}
`;

export const SSideNavPanelItems = styled(ScrollArea)`
  ${({ theme }) => `
    flex: 1;
    min-height: 0;
    padding: ${theme.spacing(4)};

    /* Descriptions wrap instead of being cut off. */
    .${sidebarItemDescriptionClasses.root} {
      white-space: normal;
    }
  `}
`;
