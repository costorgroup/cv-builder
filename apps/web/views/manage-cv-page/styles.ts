import styled from "@emotion/styled";
import { Box, Panel } from "@costor/ui";
import Link from "next/link";

export const SManageCvPage = styled.div`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: 340px 1fr 400px;
    height: 100svh;
    padding: ${theme.spacing(5)};
    background-color: color-mix(in srgb, ${theme.surfaces.mixer} 10%, ${theme.surfaces.background});
  `}
`;

export const SManageCvPageCenter = styled(Box)``;

export const SManageCvPageDocumentNameInput = styled.input`
  ${({ theme }) => `
    width: 100%;
    border: none;
    outline: none;
    font-size: ${theme.typography.h6.fontSize};
    font-weight: ${theme.typography.h6.fontWeight};
    font-family: ${theme.typography.h6.fontFamily};
    line-height: ${theme.typography.h6.lineHeight};
    font-style: ${theme.typography.h6.fontStyle};
    color: ${theme.palette.default.main};
    border-radius: ${theme.radius.md};
    background-color: transparent;
    padding: 0;
    margin: 0;
  `}
`;

export const SManageCvPageNavLink = styled(Link)<{ active?: boolean }>`
  ${({ theme, active }) => `
    text-decoration: none;
    padding: ${theme.spacing(2.5)};
    border-radius: ${theme.radius.sm};
    color: ${theme.palette.default.main};
    border-left: 5px solid ${active ? theme.palette.primary.main : "transparent"};
    background-color: ${active ? `${theme.palette.primary.main}15` : "transparent"};
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2)};
  `}
`;
