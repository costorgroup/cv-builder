import styled from "@emotion/styled";

/** An A4 page; templates size themselves off its width (`cqw`). */
export const STemplatePreview = styled.div`
  ${({ theme }) => `
    width: 100%;
    aspect-ratio: 210 / 297;
    overflow: hidden;
    container-type: inline-size;
    pointer-events: none;
    user-select: none;
    border-radius: ${theme.radius.sm};
    background-color: ${theme.palette.common.white};
    box-shadow: ${theme.shadows[2]};
  `}
`;
