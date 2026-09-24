import styled from "@emotion/styled";
import { Navigation } from "@costor/ui";

export const SAppNavigation = styled(Navigation)`
  ${({ theme }) => `
    backdrop-filter: unset;
    background-color: ${theme.surfaces.background};
  `}
`;
