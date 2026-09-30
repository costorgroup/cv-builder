import styled from "@emotion/styled";
import { accentText } from "@/utils/accent-text";
import NextLink from "next/link";
import type { TSSiteNavLinkProps } from "@/components/site-nav-links/types";

export const SSiteNavLinks = styled.nav`
  ${({ theme }) => `
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    min-width: 0;

    ${theme.breakpoints.down("lg")} {
      display: none;
    }
  `}
`;

export const SSiteNavLink = styled(NextLink, {
  shouldForwardProp: (prop) => prop !== "active",
})<TSSiteNavLinkProps>`
  ${({ theme, active }) => `
    padding: ${theme.spacing(2, 3)};
    border-radius: ${theme.radius.md};
    color: ${active ? accentText(theme) : theme.palette.default.main};
    background-color: ${active ? `${theme.palette.primary.main}15` : "transparent"};
    font-size: 0.9375rem;
    font-weight: 500;
    text-decoration: none;
    white-space: nowrap;
    transition: background-color 200ms ease-in-out, color 200ms ease-in-out;

    &:hover {
      background-color: ${theme.palette.primary.main}15;
    }

    &:focus-visible {
      outline: 2px solid ${theme.palette.primary.main};
      outline-offset: 2px;
    }
  `}
`;

/** The menu button that replaces the links on narrow screens. */
export const SSiteNavLinksMenu = styled.div`
  display: none;

  ${({ theme }) => theme.breakpoints.down("lg")} {
    display: block;
  }
`;

export const SSiteNavLinksIcon = styled.svg`
  width: 1.25em;
  height: 1.25em;
`;
