import styled from "@emotion/styled";

/** A field in a form row, at a width that suits what it holds. */
export const SEmbedsPageField = styled("div", {
  shouldForwardProp: (prop) => prop !== "width",
})<{ width: number }>`
  width: ${({ width }) => width}px;
  max-width: 100%;
`;

/** Checkboxes in rows that wrap. */
export const SEmbedsPageChecks = styled.div`
  ${({ theme }) => `
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing(1)} ${theme.spacing(4)};
  `}
`;

/** The color picker, as a swatch beside its text field. */
export const SEmbedsPageColor = styled.div`
  ${({ theme }) => `
    input {
      width: 40px;
      height: 36px;
      padding: 0;
      border: 1px solid ${theme.surfaces.divider};
      border-radius: ${theme.radius.sm};
      background: none;
      cursor: pointer;
    }
  `}
`;

/** The embed itself, in a frame, as on a customer's page. */
export const SEmbedsPagePreview = styled.iframe`
  ${({ theme }) => `
    display: block;
    width: 100%;
    height: 70vh;
    margin-top: ${theme.spacing(3)};
    border: 1px solid ${theme.surfaces.divider};
    border-radius: ${theme.radius.sm};
  `}
`;
