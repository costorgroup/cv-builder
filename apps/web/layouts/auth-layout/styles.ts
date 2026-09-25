import styled from "@emotion/styled";
import { Card } from "@costor/ui";

export const SAuthLayout = styled.main`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100svh;
  padding: ${({ theme }) => theme.spacing(4)};
`;

export const SAuthLayoutCard = styled(Card)`
  width: 100%;
  max-width: 460px;
  padding: ${({ theme }) => theme.spacing(8)};
`;
