import styled from "@emotion/styled";
import { Card, Flex } from "@costor/ui";

export const SSubscriptionPage = styled(Flex)`
  width: 100%;
  max-width: 1080px;
`;

export const SSubscriptionPagePlans = styled.div`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: ${theme.spacing(4)};
  `}
`;

export const SSubscriptionPagePlan = styled(Card, {
  shouldForwardProp: (prop) => prop !== "current",
})<{ current: boolean }>`
  ${({ theme, current }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(4)};
    padding: ${theme.spacing(6)};
    border: 2px solid ${current ? theme.palette.primary.main : "transparent"};
  `}
`;

export const SSubscriptionPageFeatures = styled.ul`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      align-items: center;
      gap: ${theme.spacing(2)};
    }
  `}
`;

export const SSubscriptionPagePlanAction = styled.div`
  margin-top: auto;
`;
