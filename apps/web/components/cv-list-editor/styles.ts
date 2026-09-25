import styled from "@emotion/styled";
import { Grid } from "@costor/ui";

export const SCvListEditorFields = styled(Grid)`
  padding: ${({ theme }) => theme.spacing(1, 0, 2)};
`;

/** Shown above the add row while the list is empty. */
export const SCvListEditorEmpty = styled.div`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
    color: ${theme.palette.secondary.main};
    font-size: 0.875rem;
    text-align: center;

    strong {
      color: ${theme.palette.default.main};
    }
  `}
`;

export const SCvListEditorIcon = styled.svg`
  width: 1em;
  height: 1em;
`;
