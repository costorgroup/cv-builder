import styled from "@emotion/styled";
import { Box, Panel } from "@costor/ui";

export const SManageCvPage = styled.div`
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100svh;
`;

export const SContent = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr 600px;
  min-height: 0;
`;

export const SLeftBox = styled(Panel)``;

export const SRightBox = styled(Box)``;

export const SCvDisplay = styled.section`
  overflow: auto;
  background-color: ${({ theme }) =>
    `color-mix(in srgb, ${theme.surfaces.mixer} 5%, transparent)`};
`;

