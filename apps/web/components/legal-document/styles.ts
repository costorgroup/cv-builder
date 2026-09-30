import styled from "@emotion/styled";
import { accentText } from "@/utils/accent-text";
import NextLink from "next/link";
import { Card, Heading } from "@costor/ui";

export const SLegalDocument = styled.div`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(5)};
    width: 100%;
  `}
`;

export const SLegalDocumentHeader = styled(Card)`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(3)};
    padding: ${theme.spacing(12, 10)};
    background-image: radial-gradient(
      circle at 90% 0%,
      ${theme.palette.primary.main}1f,
      transparent 55%
    );

    ${theme.breakpoints.down("sm")} {
      padding: ${theme.spacing(8, 5)};
    }
  `}
`;

export const SLegalDocumentTitle = styled(Heading)`
  font-size: clamp(2rem, 4vw, 2.75rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
`;

export const SLegalDocumentBody = styled.div`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr);
    align-items: start;
    gap: ${theme.spacing(5)};

    ${theme.breakpoints.down("md")} {
      grid-template-columns: minmax(0, 1fr);
    }
  `}
`;

/** Table of contents; follows the page below the sticky top bar. */
export const SLegalDocumentToc = styled(Card)`
  ${({ theme }) => `
    position: sticky;
    top: 125px;
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(5)};

    ${theme.breakpoints.down("md")} {
      position: static;
    }
  `}
`;

export const SLegalDocumentTocLink = styled(NextLink)`
  ${({ theme }) => `
    padding: ${theme.spacing(1.5, 2.5)};
    border-radius: ${theme.radius.sm};
    color: ${theme.surfaces.muted};
    font-size: 0.875rem;
    text-decoration: none;
    transition: background-color 200ms ease-in-out, color 200ms ease-in-out;

    &:hover {
      color: ${accentText(theme)};
      background-color: ${theme.palette.primary.main}10;
    }

    &:focus-visible {
      outline: 2px solid ${theme.palette.primary.main};
      outline-offset: 2px;
    }
  `}
`;

export const SLegalDocumentContent = styled(Card)`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(10)};
    padding: ${theme.spacing(10)};

    ${theme.breakpoints.down("sm")} {
      padding: ${theme.spacing(6, 5)};
    }
  `}
`;

/** Prose styles for the plain markup the legal pages are written in. */
export const SLegalDocumentSection = styled.section`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(3)};
    scroll-margin-top: 125px;
    color: ${theme.palette.default.main};
    line-height: 1.7;

    & p,
    & ul {
      margin: 0;
    }

    & ul {
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1.5)};
      padding-left: ${theme.spacing(5)};
    }

    & a {
      color: ${accentText(theme)};
    }

    & table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9375rem;
    }

    & th,
    & td {
      padding: ${theme.spacing(3)};
      border: 1px solid ${theme.surfaces.divider};
      text-align: left;
      vertical-align: top;
    }

    & th {
      background-color: ${theme.palette.primary.main}10;
    }

    & code {
      font-size: 0.875em;
    }
  `}
`;

/** Lets wide tables scroll sideways on small screens. */
export const SLegalDocumentTable = styled.div`
  width: 100%;
  overflow-x: auto;
`;
