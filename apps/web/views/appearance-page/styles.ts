import styled from "@emotion/styled";
import { Flex, Grid } from "@costor/ui";
import PremiumBadge from "@/components/premium-badge";
import type { TSAppearancePageFontProps } from "@/views/appearance-page/types";

export const SAppearancePageOptions = styled(Flex)``;

export const SAppearancePageGrid = styled(Grid)``;

/** Holds a color swatch, so a lock can sit on its corner. */
export const SAppearancePageSwatch = styled.span`
  position: relative;
  display: inline-flex;
`;

/** On an option's top corner, for options the plan doesn't include. */
export const SAppearancePageBadge = styled(PremiumBadge)`
  position: absolute;
  top: ${({ theme }) => theme.spacing(-1)};
  right: ${({ theme }) => theme.spacing(-1)};
`;

/**
 * A small lock inside a font card's top corner (the card clips anything
 * outside it). Two classes, so the card's own `span` sizing doesn't win.
 */
export const SAppearancePageFontBadge = styled(PremiumBadge)`
  ${({ theme }) => `
    && {
      position: absolute;
      top: ${theme.spacing(2)};
      right: ${theme.spacing(2)};
      font-size: 0.625rem;
    }
  `}
`;

export const SAppearancePageFont = styled("button", {
  shouldForwardProp: (prop) => !["fontFamily", "selected"].includes(prop),
})<TSAppearancePageFontProps>`
  ${({ theme, fontFamily, selected }) => `
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: ${theme.spacing(0.5)};
    padding: ${theme.spacing(2.5)};
    border-radius: ${theme.radius.sm};
    border: 2px solid ${selected ? theme.palette.primary.main : "transparent"};
    background-color: ${selected ? `${theme.palette.primary.main}15` : `color-mix(in srgb, ${theme.surfaces.mixer} 5%, transparent)`};
    color: ${theme.palette.default.main};
    font-family: ${fontFamily};
    text-align: left;
    cursor: pointer;
    transition: border-color 300ms ease-in-out, background-color 300ms ease-in-out;

    strong {
      font-size: 1.5rem;
      line-height: 1;
    }

    span {
      font-size: 0.8125rem;
    }
  `}
`;
