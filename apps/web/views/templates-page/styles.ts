import styled from "@emotion/styled";
import { Grid } from "@costor/ui";
import type { TSTemplatesPageCardProps } from "@/views/templates-page/types";

export const STemplatesPageGrid = styled(Grid)`
  padding: ${({ theme }) => theme.spacing(2.5)} 0;
`;

export const STemplatesPageCard = styled("div", {
  shouldForwardProp: (prop) => !["selected"].includes(prop),
})<TSTemplatesPageCardProps>`
  ${({ theme, selected }) => `
    position: relative;
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
    padding: ${theme.spacing(2)};
    border-radius: ${theme.radius.sm};
    border: 2px solid ${selected ? theme.palette.primary.main : "transparent"};
    background-color: ${selected ? `${theme.palette.primary.main}15` : "transparent"};
    color: ${theme.palette.default.main};
    text-align: center;
    transition: border-color 300ms ease-in-out, background-color 300ms ease-in-out;

    &:has(button:focus-visible) {
      outline: 2px solid ${theme.palette.primary.main};
      outline-offset: 2px;
    }
  `}
`;

/** A scaled-down page; templates size themselves off its width (`cqw`). */
export const STemplatesPagePreview = styled.div`
  ${({ theme }) => `
    width: 100%;
    aspect-ratio: 210 / 297;
    overflow: hidden;
    container-type: inline-size;
    pointer-events: none;
    background-color: ${theme.palette.common.white};
    box-shadow: ${theme.shadows[2]};
  `}
`;

/** Covers the whole card, so the preview inside can stay plain markup. */
export const STemplatesPageSelect = styled.button`
  position: absolute;
  inset: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;

  &:focus {
    outline: none;
  }
`;
