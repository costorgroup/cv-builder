import styled from "@emotion/styled";
import NextLink from "next/link";
import { Card, Flex } from "@costor/ui";

/** Holds the card and its actions button, which sits on the card's corner. */
export const SCvCard = styled.div`
  position: relative;
  min-width: 0;
`;

export const SCvCardBody = styled(Card)`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2.5)};
    padding: ${theme.spacing(2.5)};
    min-width: 0;
    height: 100%;
  `}
`;

/** The CV's first page, scaled down; A4 so skeletons and CVs line up. */
export const SCvCardThumbnail = styled.div`
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

export const SCvCardText = styled(Flex)`
  min-width: 0;

  & > * {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

/** The whole card opens the CV in the editor. */
export const SCvCardLink = styled(NextLink)`
  ${({ theme }) => `
    display: block;
    height: 100%;
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
  `}
`;

/** The "…" button, over the thumbnail's top corner. */
export const SCvCardActions = styled.div`
  ${({ theme }) => `
    position: absolute;
    top: ${theme.spacing(4)};
    right: ${theme.spacing(4)};
  `}
`;
