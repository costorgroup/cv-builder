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

/**
 * Keeps the top bar in view. Behind the bar, a frosted layer covers the
 * gutters above and beside it and a fade below it, so content scrolling
 * under blurs out instead of showing through sharply. A scroll-driven
 * animation fades it in over the first bit of scroll, so the hero stays clear
 * at the top; browsers without scroll timelines never show it.
 */
export const SSiteLayoutNav = styled.div`
  ${({ theme }) => `
    --nav-fade: ${theme.spacing(5)};
    position: sticky;
    top: 0;
    z-index: ${theme.zIndex.appBar};
    padding-top: var(--site-gutter);

    &::before {
      content: "";
      position: absolute;
      inset: 0 calc(var(--site-gutter) * -1) calc(var(--nav-fade) * -1);
      z-index: -1;
      background: linear-gradient(
        to bottom,
        color-mix(in srgb, ${theme.surfaces.background} 50%, transparent),
        color-mix(in srgb, ${theme.surfaces.background} 20%, transparent)
          calc(100% - var(--nav-fade)),
        transparent
      );
      backdrop-filter: blur(12px);
      mask-image: linear-gradient(
        to bottom,
        #000 calc(100% - var(--nav-fade)),
        transparent
      );
      opacity: 0;
      pointer-events: none;
    }

    @supports (animation-timeline: scroll()) {
      &::before {
        animation: site-nav-frost-in linear both;
        animation-timeline: scroll(root);
        animation-range: 0 100vh;
      }
    }

    @keyframes site-nav-frost-in {
      to {
        opacity: 1;
      }
    }
  `}
`;

export const SSiteLayoutContent = styled.main`
  flex: 1;
  width: 100%;
`;
