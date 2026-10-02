import styled from "@emotion/styled";

/** The wide prompt's icon, on a tile a shade lighter than the alert. */
export const SUpgradePromptIcon = styled.span`
  ${({ theme }) => `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: ${theme.radius.md};
    border: 1px solid color-mix(in srgb, ${theme.palette.warning.main} 25%, transparent);
    background-color: color-mix(in srgb, ${theme.surfaces.background} 60%, transparent);
    color: ${theme.palette.warning.main};
  `}
`;
