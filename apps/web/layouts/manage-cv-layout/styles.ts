import styled from "@emotion/styled";
import type { Theme } from "@emotion/react";
import {
  Box,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Chip,
  Flex,
  Heading,
  ScrollArea,
  scrollAreaClasses,
} from "@costor/ui";
import { TOP_NAV_HEIGHT, TOP_NAV_HEIGHT_SM } from "@/components/top-nav/styles";

/** Tinted backdrop behind CV pages (the editor workspace, the export preview). */
export const cvWorkspaceBackground = (theme: Theme) =>
  `color-mix(in srgb, ${theme.surfaces.mixer} 10%, ${theme.surfaces.background})`;

const CARD_WIDTH = 480;

/**
 * The top bar (in the app), then the editor card; the preview fills the rest
 * of the screen behind them. Sets `--cv-gutter`, the padding around it all,
 * and `--cv-body-top`, where the card starts.
 */
export const SManageCvLayout = styled("div", {
  shouldForwardProp: (prop) => prop !== "topNav",
})<{ topNav?: boolean }>`
  ${({ theme, topNav }) => `
    --cv-gutter: ${theme.spacing(5)};
    --cv-body-top: ${topNav ? `calc(var(--cv-gutter) * 2 + ${TOP_NAV_HEIGHT}px)` : "var(--cv-gutter)"};
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--cv-gutter);
    height: 100vh;
    padding: var(--cv-gutter);
    overflow: hidden;
    background-color: ${cvWorkspaceBackground(theme)};
    /* Lets the top bar's frost follow the preview's scroll. */
    timeline-scope: --cv-preview;

    ${theme.breakpoints.down("sm")} {
      --cv-body-top: ${topNav ? `calc(var(--cv-gutter) * 2 + ${TOP_NAV_HEIGHT_SM}px)` : "var(--cv-gutter)"};
    }
  `}
`;

/**
 * Above the preview. Behind the bar, a frosted layer covers the gutters
 * above and beside it and fades out below it, so the CV scrolling under it
 * blurs out, as on the site. The blur is always on; the tint over it fades
 * in over the first bit of the preview's scroll (browsers without scroll
 * timelines show the blur without the tint).
 */
export const SManageCvLayoutNav = styled.div`
  ${({ theme }) => `
    --nav-fade: var(--cv-gutter);
    position: relative;
    z-index: ${theme.zIndex.appBar};

    /* Both layers: behind the bar, over the gutters, fading out below. */
    &::before,
    &::after {
      content: "";
      position: absolute;
      inset: calc(var(--cv-gutter) * -1) calc(var(--cv-gutter) * -1)
        calc(var(--nav-fade) * -1);
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

    /* The tint, as the preview scrolls. */
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
        animation: cv-nav-frost-in linear both;
        animation-timeline: --cv-preview;
        animation-range: 0 ${theme.spacing(15)};
      }
    }

    @keyframes cv-nav-frost-in {
      to {
        opacity: 1;
      }
    }
  `}
`;

/** Only as wide as the card, so the preview beside it can be scrolled. */
export const SManageCvLayoutBody = styled.div`
  position: relative;
  z-index: 1;
  width: ${CARD_WIDTH}px;
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: ${CARD_WIDTH}px;
  grid-template-rows: minmax(0, 1fr);
`;

/**
 * Right of the card, from the top of the screen to the bottom, so the CV
 * scrolls under the top bar instead of being cut off at the padding. At rest
 * it lines up with the card.
 */
export const SManageCvLayoutPreview = styled(Box)`
  ${({ theme }) => `
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: calc(var(--cv-gutter) + ${CARD_WIDTH}px);
    padding: var(--cv-body-top) ${theme.spacing(15)} var(--cv-gutter);
    overflow-y: scroll;
    scroll-timeline-name: --cv-preview;
    &::-webkit-scrollbar {
      display: none;
    }
  `}
`;

export const SManageCvLayoutPreviewCenter = styled(Box)`
  ${({ theme }) => `
    max-width: 800px;
    margin: auto;
  `}
`;

export const SManageCvLayoutDocumentNameInput = styled.input`
  ${({ theme }) => `
    width: 100%;
    border: none;
    outline: none;
    font-size: ${theme.typography.h6.fontSize};
    font-weight: ${theme.typography.h6.fontWeight};
    font-family: ${theme.typography.h6.fontFamily};
    line-height: ${theme.typography.h6.lineHeight};
    font-style: ${theme.typography.h6.fontStyle};
    color: ${theme.palette.default.main};
    border-radius: ${theme.radius.md};
    background-color: transparent;
    padding: 0;
    margin: 0;
  `}
`;

export const SManageCvLayoutCardWrapper = styled(Box)`
  width: 100%;
  height: 100%;
`;

export const SManageCvLayoutCard = styled(Card)`
  ${({ theme }) => `
    padding: 0;
    width: 100%;
    height: 100%;
    max-height: 100%;
    display: grid;
    grid-template-columns: 80px 1fr;
    grid-template-rows: 80px minmax(0, 1fr) 80px;
    gap: 0;
  `}
`;

// Pushed to the bottom of SManageCvLayoutNavContent, just above the footer.
export const SManageCvLayoutCompletion = styled(Flex)`
  ${({ theme }) => `
    width: 100%;
    max-width: 180px;
  `}
`;

// CardContent is a ScrollArea; its viewport is a plain block, so the content
// only grows as tall as it needs. Making the viewport a flex column lets the
// content fill the card body, so the completion bar can sit at the bottom.
// Taller content still scrolls (it can grow, not shrink).
export const SManageCvLayoutNavContent = styled(Flex)`
  ${({ theme }) => `
    grid-column: 1;
    grid-row: 1 / span 2;
    width: 100%;
    height: 100%;
    padding: ${theme.spacing(4)};
    border-right: 1px solid ${theme.surfaces.divider};
    overflow-y: auto;
  `}
`;

/** An embed's own logo, above the steps. */
export const SManageCvLayoutBrand = styled.div`
  ${({ theme }) => `
    display: flex;
    justify-content: center;
    width: 100%;
    padding-bottom: ${theme.spacing(2)};
    border-bottom: 1px solid ${theme.surfaces.divider};
  `}
`;

/** Back to the CVs, then the step's title and description, over the step. */
export const SManageCvLayoutCardHeader = styled.div`
  ${({ theme }) => `
    grid-column: 2;
    grid-row: 1;
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2)};
    padding: ${theme.spacing(4)};
    width: 100%;
    height: 100%;
    min-width: 0;
    border-bottom: 1px solid ${theme.surfaces.divider};
  `}
`;

export const SManageCvLayoutCardTitle = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const SManageCvLayoutCardFooter = styled(CardFooter)`
  ${({ theme }) => `
    padding: ${theme.spacing(4)};
    display: flex;
    justify-content: space-between;
    gap: ${theme.spacing(4)};
    grid-column: span 2;
  `}
`;

export const SManageCvLayoutContent = styled(ScrollArea)`
  ${({ theme }) => `
    grid-column: 2;
    grid-row: 2;
    width: 100%;
    height: 100%;
    padding: ${theme.spacing(4)};
  `}
`;

/** Centers a message (e.g. "CV not found") on the workspace background. */
export const SManageCvLayoutMessage = styled.div`
  ${({ theme }) => `
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: ${theme.spacing(5)};
    background-color: ${cvWorkspaceBackground(theme)};

    & > * {
      width: 100%;
      max-width: 520px;
    }
  `}
`;
