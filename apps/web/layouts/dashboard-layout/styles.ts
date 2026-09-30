import styled from "@emotion/styled";
import { cvWorkspaceBackground } from "@/layouts/manage-cv-layout/styles";

export const SDashboardLayout = styled.div`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(5)};
    min-height: 100vh;
    padding: ${theme.spacing(5)};
    background-color: ${cvWorkspaceBackground(theme)};
  `}
`;

export const SDashboardLayoutContent = styled.main`
  flex: 1;
  width: 100%;
`;

export const SDashboardLayoutSearch = styled.div`
  width: 360px;
  min-width: 0;
`;
