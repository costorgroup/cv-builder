import styled from "@emotion/styled";
import type { Theme } from "@emotion/react";
import {
  Box,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Chip,
  Flex,
  Heading,
  ScrollArea,
  scrollAreaClasses,
} from "@costor/ui";

/** Tinted backdrop behind CV pages (the editor workspace, the export preview). */
export const cvWorkspaceBackground = (theme: Theme) =>
  `color-mix(in srgb, ${theme.surfaces.mixer} 10%, ${theme.surfaces.background})`;

export const SManageCvLayout = styled.div`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: 480px 1fr;
    grid-template-rows: 100%;
    height: 100vh;
    background-color: ${cvWorkspaceBackground(theme)};
  `}
`;

export const SManageCvLayoutPreview = styled(Box)`
  ${({ theme }) => `
    padding: ${theme.spacing(15)};
    width: 100%;
    height: 100%;
    overflow-y: scroll;
    &::-webkit-scrollbar {
      display: none;
    }
  `}
`;

export const SManageCvLayoutPreviewCenter = styled(Box)`
  ${({ theme }) => `
    max-width: 800px;
    margin: auto;
  `}
`;

export const SManageCvLayoutDocumentNameInput = styled.input`
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

export const SManageCvLayoutCardWrapper = styled(Box)`
  ${({ theme }) => `
    width: 100%;
    padding: ${theme.spacing(5, 0, 5, 5)};
    height: 100%;
  `}
`;

export const SManageCvLayoutCard = styled(Card)`
  ${({ theme }) => `
    padding: 0;
    width: 100%;
    height: 100%;
    max-height: 100%;
    display: grid;
    grid-template-columns: 80px 1fr;
    grid-template-rows: 80px 1fr 80px;
    gap: 0;
  `}
`;

// Pushed to the bottom of SManageCvLayoutNavContent, just above the footer.
export const SManageCvLayoutCompletion = styled(Flex)`
  ${({ theme }) => `
    width: 100%;
    max-width: 180px;
  `}
`;

// CardContent is a ScrollArea; its viewport is a plain block, so the content
// only grows as tall as it needs. Making the viewport a flex column lets the
// content fill the card body, so the completion bar can sit at the bottom.
// Taller content still scrolls (it can grow, not shrink).
export const SManageCvLayoutNavContent = styled(Flex)`
  ${({ theme }) => `
    width: 100%;
    height: 100%;
    padding: ${theme.spacing(4)};
    border-right: 1px solid ${theme.surfaces.divider};
    overflow-y: auto;
  `}
`;

/** Actions at the bottom of the nav rail (e.g. the theme toggle). */
export const SManageCvLayoutNavActions = styled.div`
  ${({ theme }) => `
    display: flex;
    justify-content: center;
    margin-top: auto;
    padding-top: ${theme.spacing(2)};
  `}
`;

/** Logo + "CV Builder" in the sidebar header. */
export const SManageCvLayoutBrand = styled.div`
  ${({ theme }) => `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-right: 1px solid ${theme.surfaces.divider};
    border-bottom: 1px solid ${theme.surfaces.divider};
  `}
`;

export const SManageCvLayoutCardHeader = styled.div`
  ${({ theme }) => `
    padding: ${theme.spacing(4)};
    width: 100%;
    height: 100%;
    border-bottom: 1px solid ${theme.surfaces.divider};
  `}
`;

export const SManageCvLayoutCardFooter = styled(CardFooter)`
  ${({ theme }) => `
    padding: ${theme.spacing(4)};
    display: flex;
    justify-content: space-between;
    gap: ${theme.spacing(4)};
    grid-column: span 2;
  `}
`;

export const SManageCvLayoutContent = styled(ScrollArea)`
  ${({ theme }) => `
    width: 100%;
    height: 100%;
    padding: ${theme.spacing(4)};
  `}
`;

/** Centers a message (e.g. "CV not found") on the workspace background. */
export const SManageCvLayoutMessage = styled.div`
  ${({ theme }) => `
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: ${theme.spacing(5)};
    background-color: ${cvWorkspaceBackground(theme)};

    & > * {
      width: 100%;
      max-width: 520px;
    }
  `}
`;
