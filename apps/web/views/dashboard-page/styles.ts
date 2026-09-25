import styled from "@emotion/styled";
import NextLink from "next/link";
import { Card, Flex } from "@costor/ui";

export const SDashboardPage = styled(Flex)`
  width: 100%;
`;

export const SDashboardPageGrid = styled.div`
  ${({ theme }) => `
    display: grid;
    /* Column counts that divide the page size (12), so rows come out even. */
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: ${theme.spacing(4)};

    @media (max-width: 1300px) {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    @media (max-width: 950px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    @media (max-width: 700px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    @media (max-width: 420px) {
      grid-template-columns: minmax(0, 1fr);
    }
  `}
`;

export const SDashboardPageCard = styled(Card)`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2.5)};
    padding: ${theme.spacing(2.5)};
    min-width: 0;
  `}
`;

/** The CV's first page, scaled down; A4 so skeletons and CVs line up. */
export const SDashboardPageThumbnail = styled.div`
  ${({ theme }) => `
    width: 100%;
    aspect-ratio: 210 / 297;
    overflow: hidden;
    border-radius: ${theme.radius.sm};
    border: 1px solid ${theme.surfaces.divider};
    background-color: #ffffff;
    pointer-events: none;
  `}
`;

export const SDashboardPageCardText = styled(Flex)`
  min-width: 0;

  & > * {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

/** The whole card opens the CV in the editor. */
export const SDashboardPageCardLink = styled(NextLink)`
  ${({ theme }) => `
    display: block;
    min-width: 0;
    border-radius: ${theme.radius.lg};
    color: inherit;
    text-decoration: none;
    transition: transform 200ms ease-in-out;

    &:hover {
      transform: translateY(-4px);
    }

    &:focus-visible {
      outline: 2px solid ${theme.palette.primary.main};
      outline-offset: 2px;
    }

    & > * {
      height: 100%;
    }
  `}
`;
