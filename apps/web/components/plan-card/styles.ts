import styled from "@emotion/styled";
import { Card } from "@costor/ui";
import type { TSPlanCardProps } from "@/components/plan-card/types";

export const SPlanCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "highlighted",
})<TSPlanCardProps>`
  ${({ theme, highlighted }) => `
    position: relative;
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(6)};
    height: 100%;
    padding: ${theme.spacing(8)};
    border: 2px solid ${highlighted ? theme.palette.primary.main : "transparent"};

    ${theme.breakpoints.down("sm")} {
      padding: ${theme.spacing(6)};
    }
  `}
`;

export const SPlanCardPrice = styled.div`
  ${({ theme }) => `
    display: flex;
    align-items: baseline;
    gap: ${theme.spacing(1.5)};
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
    color: ${theme.palette.default.main};
  `}
`;

export const SPlanCardFeatures = styled.ul`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(3)};
    flex: 1;
    margin: 0;
    padding: 0;
    list-style: none;
  `}
`;

export const SPlanCardFeature = styled.li`
  ${({ theme }) => `
    display: flex;
    align-items: center;
    gap: ${theme.spacing(2.5)};
    color: ${theme.palette.default.main};

    & > svg {
      flex-shrink: 0;
      color: ${theme.palette.success.main};
    }
  `}
`;
