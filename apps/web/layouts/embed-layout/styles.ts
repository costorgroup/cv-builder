import styled from "@emotion/styled";
import { Flex } from "@costor/ui";

/** Fills the frame, on the page background (no site chrome). */
export const SEmbedLayout = styled.div`
  ${({ theme }) => `
    position: relative;
    min-height: 100vh;
    background-color: ${theme.surfaces.background};
    color: ${theme.palette.default.main};
  `}
`;

export const SEmbedLayoutMessage = styled(Flex)`
  ${({ theme }) => `
    min-height: 100vh;
    align-items: center;
    justify-content: center;
    padding: ${theme.spacing(5)};
  `}
`;

/** "Made with CV Builder", unless the plan is white-label. */
export const SEmbedLayoutCredit = styled.a`
  ${({ theme }) => `
    position: fixed;
    right: ${theme.spacing(3)};
    bottom: ${theme.spacing(3)};
    z-index: 10;
    padding: ${theme.spacing(1)} ${theme.spacing(2.5)};
    border-radius: ${theme.radius.pill};
    background-color: ${theme.surfaces.background};
    box-shadow: ${theme.shadows[2]};
    color: ${theme.palette.default.main};
    font-size: 0.75rem;
    text-decoration: none;
    opacity: 0.85;

    &:hover {
      opacity: 1;
    }
  `}
`;
