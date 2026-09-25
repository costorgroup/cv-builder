import styled from "@emotion/styled";
import { Card } from "@costor/ui";
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

/** The top bar: logo | title & description | search & create | theme & account. */
export const SDashboardLayoutNav = styled(Card)`
  padding: 0;
  width: 100%;
  height: 80px;
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 80px auto minmax(0, 1fr) auto;
  gap: 0;
`;

export const SDashboardLayoutBrand = styled.div`
  ${({ theme }) => `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-right: 1px solid ${theme.surfaces.divider};
  `}
`;

export const SDashboardLayoutHeader = styled.div`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    padding: ${theme.spacing(0, 4)};
  `}
`;

export const SDashboardLayoutActions = styled.div`
  ${({ theme }) => `
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2)};
    padding: ${theme.spacing(0, 4)};
  `}
`;

export const SDashboardLayoutContent = styled.main`
  flex: 1;
  width: 100%;
`;

/** Search and the create menu, on the left after the title. */
export const SDashboardLayoutTools = styled.div`
  ${({ theme }) => `
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2)};
    min-width: 0;
    padding: ${theme.spacing(0, 4)};
    border-left: 1px solid ${theme.surfaces.divider};
  `}
`;

export const SDashboardLayoutSearch = styled.div`
  width: 360px;
  min-width: 0;
`;
