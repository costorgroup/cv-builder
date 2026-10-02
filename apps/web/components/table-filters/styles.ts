import styled from "@emotion/styled";

/** The fields, one under another. */
export const STableFiltersFields = styled.div`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(4)};
  `}
`;

export const STableFiltersIcon = styled.svg`
  width: 1.25em;
  height: 1.25em;
  flex-shrink: 0;
`;

/** The chosen values of a multi-select, as chips that wrap onto new lines. */
export const STableFiltersChips = styled.span`
  ${({ theme }) => `
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing(1)};
    min-width: 0;
    padding: ${theme.spacing(0.5, 0)};
  `}
`;

/**
 * A chip's ✕. Not a button: the chips sit inside the select's own button,
 * where another button can't go. The open list removes values by keyboard.
 */
export const STableFiltersChipRemove = styled.span`
  ${({ theme }) => `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: ${theme.spacing(0.5)};
    margin-right: -${theme.spacing(0.5)};
    border-radius: ${theme.radius.full};
    cursor: pointer;
    opacity: 0.7;

    &:hover {
      opacity: 1;
    }

    svg {
      width: 0.85em;
      height: 0.85em;
    }
  `}
`;
