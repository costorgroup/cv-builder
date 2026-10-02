import styled from "@emotion/styled";
import { TOP_NAV_HEIGHT, TOP_NAV_HEIGHT_SM } from "@/components/top-nav/styles";
import { cvWorkspaceBackground } from "@/layouts/manage-cv-layout/styles";

/**
 * The page scrolls as a whole, under the frosted top bar. Sets
 * `--top-nav-gutter`, the padding around everything, and `--dashboard-top`,
 * where the content starts below the bar. Pages here are often short, so the
 * bar is fully frosted after a little scroll, not a screen's worth.
 */
export const SDashboardLayout = styled.div`
  ${({ theme }) => `
    --top-nav-gutter: ${theme.spacing(5)};
    --top-nav-frost-range: ${theme.spacing(15)};
    --dashboard-top: calc(var(--top-nav-gutter) * 2 + ${TOP_NAV_HEIGHT}px);
    display: flex;
    flex-direction: column;
    gap: var(--top-nav-gutter);
    min-height: 100vh;
    padding: 0 var(--top-nav-gutter) var(--top-nav-gutter);
    background-color: ${cvWorkspaceBackground(theme)};

    ${theme.breakpoints.down("sm")} {
      --top-nav-gutter: ${theme.spacing(3)};
      --dashboard-top: calc(var(--top-nav-gutter) * 2 + ${TOP_NAV_HEIGHT_SM}px);
    }
  `}
`;

/** Side nav and page; the nav moves above the page on small screens. */
export const SDashboardLayoutBody = styled.div`
  ${({ theme }) => `
    flex: 1;
    display: grid;
    grid-template-columns: 480px minmax(0, 1fr);
    align-items: start;
    gap: var(--top-nav-gutter);

    ${theme.breakpoints.down("md")} {
      grid-template-columns: minmax(0, 1fr);
    }
  `}
`;

/**
 * Holds the side nav in place below the top bar, filling the rest of the
 * screen, while the page scrolls; the side nav scrolls on its own inside.
 */
export const SDashboardLayoutAside = styled.div`
  ${({ theme }) => `
    position: sticky;
    top: var(--dashboard-top);
    height: calc(100vh - var(--dashboard-top) - var(--top-nav-gutter));
    min-width: 0;

    ${theme.breakpoints.down("md")} {
      position: static;
      height: auto;
    }
  `}
`;

export const SDashboardLayoutContent = styled.main`
  width: 100%;
  min-width: 0;
`;

export const SDashboardLayoutSearch = styled.div`
  width: 360px;
  min-width: 0;
`;

export const SDashboardLayoutIcon = styled.svg`
  width: 1.25em;
  height: 1.25em;
  flex-shrink: 0;
`;
