import styled from "@emotion/styled";
import { Flex } from "@costor/ui";
import { cvWorkspaceBackground } from "@/layouts/manage-cv-layout/styles";

/** Preview on the left, export settings on the right. */
export const SCvExportModalBody = styled.div`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: minmax(0, 1fr) 280px;
    gap: ${theme.spacing(6)};
    padding: ${theme.spacing(2.5)} 0;
  `}
`;

export const SCvExportModalPreview = styled(Flex)`
  min-width: 0;
`;

/** Tinted backdrop behind the page, like the editor workspace. */
export const SCvExportModalStage = styled(Flex)`
  ${({ theme }) => `
    width: 100%;
    padding: ${theme.spacing(6)};
    border-radius: ${theme.radius.md};
    background-color: ${cvWorkspaceBackground(theme)};
  `}
`;

/** Keeps a page at a readable size. */
export const SCvExportModalPage = styled.div`
  width: 100%;
  max-width: 460px;
`;

export const SCvExportModalSettings = styled(Flex)`
  min-width: 0;
`;
