import styled from "@emotion/styled";

/** A key or a command, in a monospace block that wraps anywhere. */
export const SApiKeysPageCode = styled.pre`
  ${({ theme }) => `
    margin: ${theme.spacing(2)} 0 0;
    padding: ${theme.spacing(2)} ${theme.spacing(3)};
    border-radius: ${theme.radius.sm};
    background-color: color-mix(in srgb, ${theme.surfaces.mixer} 6%, transparent);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.8125rem;
    white-space: pre-wrap;
    overflow-wrap: anywhere;

    span& {
      display: inline-block;
      margin: 0;
      padding: 0;
      background: none;
    }
  `}
`;

export const SApiKeysPageScopes = styled.div`
  ${({ theme }) => `
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing(1)} ${theme.spacing(3)};
  `}
`;

/** A field in the form row, at a width that suits what it holds. */
export const SApiKeysPageField = styled("div", {
  shouldForwardProp: (prop) => prop !== "width",
})<{ width: number }>`
  width: ${({ width }) => width}px;
  max-width: 100%;
`;
