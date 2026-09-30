import styled from "@emotion/styled";
import { accentText } from "@/utils/accent-text";
import NextLink from "next/link";
import { Card } from "@costor/ui";
import { waveMask } from "@/utils/wave-mask";

/** Full-bleed footer with a wavy top edge; content is held to 1200px. */
export const SSiteFooter = styled(Card)`
  ${({ theme }) => `
    --wave: ${theme.spacing(16)};
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(8)};
    /* Card sets width: 100%; auto lets the negative margins widen it. */
    width: auto;
    margin: 0 calc(var(--site-gutter) * -1);
    padding: calc(${theme.spacing(10)} + var(--wave))
      max(${theme.spacing(10)}, calc((100% - 1200px) / 2)) ${theme.spacing(10)};
    border: none;
    ${waveMask("top", "var(--wave)")}

    ${theme.breakpoints.down("sm")} {
      --wave: ${theme.spacing(8)};
      padding: calc(${theme.spacing(6)} + var(--wave)) ${theme.spacing(6)} ${theme.spacing(6)};
    }
  `}
`;

export const SSiteFooterGrid = styled.div`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr));
    gap: ${theme.spacing(8)};

    ${theme.breakpoints.down("md")} {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    ${theme.breakpoints.down("sm")} {
      grid-template-columns: minmax(0, 1fr);
    }
  `}
`;

export const SSiteFooterBrand = styled.div`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(3)};
    max-width: 320px;

    ${theme.breakpoints.down("md")} {
      grid-column: 1 / -1;
    }
  `}
`;

export const SSiteFooterColumn = styled.nav`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2.5)};
  `}
`;

export const SSiteFooterLink = styled(NextLink)`
  ${({ theme }) => `
    width: fit-content;
    color: ${theme.surfaces.muted};
    font-size: 0.875rem;
    text-decoration: none;
    transition: color 200ms ease-in-out;

    &:hover {
      color: ${accentText(theme)};
    }

    &:focus-visible {
      outline: 2px solid ${theme.palette.primary.main};
      outline-offset: 2px;
    }
  `}
`;

export const SSiteFooterBottom = styled.div`
  ${({ theme }) => `
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: ${theme.spacing(2)};
    padding-top: ${theme.spacing(6)};
    border-top: 1px solid ${theme.surfaces.divider};
  `}
`;
