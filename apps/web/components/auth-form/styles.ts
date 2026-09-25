import styled from "@emotion/styled";
import { Flex } from "@costor/ui";

export const SAuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
`;

export const SAuthFormFooter = styled(Flex)`
  text-align: center;
`;
