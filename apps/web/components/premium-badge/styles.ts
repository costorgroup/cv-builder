import styled from "@emotion/styled";
import { Chip } from "@costor/ui";
import type { TSPremiumBadgeProps } from "@/components/premium-badge/types";

export const SPremiumBadge = styled(Chip, {
  shouldForwardProp: (prop) => prop !== "iconOnly",
})<TSPremiumBadgeProps>`
  ${({ theme, iconOnly }) => `
    gap: ${theme.spacing(1)};
    /* The app's font, even inside an option previewing another one. */
    font-family: ${theme.typography.fontFamily};
    pointer-events: none;

    ${
      iconOnly
        ? `
          /* Just the lock: as much space at the sides as above and below. */
          padding: 0.25em;
          line-height: 1;
        `
        : ""
    }
  `}
`;

export const SPremiumBadgeIcon = styled.svg`
  width: 1em;
  height: 1em;
  flex-shrink: 0;
`;
