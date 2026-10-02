import styled from "@emotion/styled";
import { TOP_NAV_HEIGHT, TOP_NAV_HEIGHT_SM } from "@/components/top-nav/styles";
import { cvWorkspaceBackground } from "@/layouts/manage-cv-layout/styles";

/**
 * Sets two variables for full-bleed content (hero, marquee, footer):
 * `--site-gutter`, the side padding and gap to cancel out, and
 * `--site-nav-height`, how far the top bar reaches down the page.
 */
export const SSiteLayout = styled.div`
  ${({ theme }) => `
    --site-gutter: ${theme.spacing(5)};
    --site-nav-height: calc(var(--site-gutter) + ${TOP_NAV_HEIGHT}px);
    --top-nav-gutter: var(--site-gutter);
    display: flex;
    flex-direction: column;
    gap: var(--site-gutter);
    min-height: 100vh;
    padding: 0 var(--site-gutter);
    overflow-x: clip;
    background-color: ${cvWorkspaceBackground(theme)};

    ${theme.breakpoints.down("sm")} {
      --site-gutter: ${theme.spacing(3)};
      --site-nav-height: calc(var(--site-gutter) + ${TOP_NAV_HEIGHT_SM}px);
    }
  `}
`;

export const SSiteLayoutContent = styled.main`
  flex: 1;
  width: 100%;
`;
