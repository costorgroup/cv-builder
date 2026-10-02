import styled from "@emotion/styled";

/** Height of the row, the same as the editor's progress and actions row. */
export const COPYRIGHT_HEIGHT = 80;

/** The last row of a card, across all its columns. */
export const SCopyright = styled.div`
  ${({ theme }) => `
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    min-width: 0;
    height: ${COPYRIGHT_HEIGHT}px;
    padding: ${theme.spacing(0, 4)};
    border-top: 1px solid ${theme.surfaces.divider};
  `}
`;
