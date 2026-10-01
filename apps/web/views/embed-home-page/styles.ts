import styled from "@emotion/styled";

export const SEmbedHomePage = styled.div`
  ${({ theme }) => `
    width: 100%;
    max-width: 760px;
    margin: 0 auto;
    padding: ${theme.spacing(6)} ${theme.spacing(4)} ${theme.spacing(12)};
  `}
`;
