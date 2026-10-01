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

    ${theme.breakpoints.down("sm")} {
      gap: ${theme.spacing(3)};
      padding: ${theme.spacing(3)};
    }
  `}
`;

/** Side nav and page; the nav moves above the page on small screens. */
export const SDashboardLayoutBody = styled.div`
  ${({ theme }) => `
    flex: 1;
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
    align-items: start;
    gap: ${theme.spacing(5)};

    ${theme.breakpoints.down("md")} {
      grid-template-columns: minmax(0, 1fr);
      gap: ${theme.spacing(3)};
    }
  `}
`;

export const SDashboardLayoutContent = styled.main`
  width: 100%;
  min-width: 0;
`;

export const SDashboardLayoutSearch = styled.div`
  width: 360px;
  min-width: 0;
`;

export const SDashboardLayoutIcon = styled.svg`
  width: 1.25em;
  height: 1.25em;
  flex-shrink: 0;
`;
