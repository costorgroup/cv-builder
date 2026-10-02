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

/**
 * Keeps the top bar in view, `--top-nav-gutter` below the top of the page
 * (set by the layout). Behind the bar, a frosted layer covers the gutters
 * above and beside it and a fade below it, so content scrolling under blurs
 * out instead of showing through sharply. The blur is always on; the tint
 * over it fades in over the first `--top-nav-frost-range` of scroll (a
 * screen's height unless the layout sets it), so the page stays clear at the
 * top. Browsers without scroll timelines show the blur without the tint.
 */
export const STopNavFrost = styled.div`
  ${({ theme }) => `
    --nav-fade: ${theme.spacing(5)};
    position: sticky;
    top: 0;
    z-index: ${theme.zIndex.appBar};
    padding-top: var(--top-nav-gutter);

    /* Both layers: behind the bar, over the gutters, fading out below. */
    &::before,
    &::after {
      content: "";
      position: absolute;
      inset: 0 calc(var(--top-nav-gutter) * -1) calc(var(--nav-fade) * -1);
      z-index: -1;
      mask-image: linear-gradient(
        to bottom,
        #000 calc(100% - var(--nav-fade)),
        transparent
      );
      pointer-events: none;
    }

    /* The blur, always on. */
    &::before {
      backdrop-filter: blur(12px);
    }

    /* The tint, as the page scrolls. */
    &::after {
      background: linear-gradient(
        to bottom,
        color-mix(in srgb, ${theme.surfaces.background} 50%, transparent),
        color-mix(in srgb, ${theme.surfaces.background} 20%, transparent)
          calc(100% - var(--nav-fade)),
        transparent
      );
      opacity: 0;
    }

    @supports (animation-timeline: scroll()) {
      &::after {
        animation: top-nav-frost-in linear both;
        animation-timeline: scroll(root);
        animation-range: 0 var(--top-nav-frost-range, 100vh);
      }
    }

    @keyframes top-nav-frost-in {
      to {
        opacity: 1;
      }
    }
  `}
`;
