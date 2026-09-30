import styled from "@emotion/styled";
import { Card, Flex, Heading } from "@costor/ui";

export const SPricingPage = styled(Flex)`
  ${({ theme }) => `
    width: 100%;
    gap: ${theme.spacing(16)};

    ${theme.breakpoints.down("sm")} {
      gap: ${theme.spacing(10)};
    }
  `}
`;

export const SPricingHero = styled(Card)`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${theme.spacing(8)};
    padding: ${theme.spacing(16, 10)};
    text-align: center;
    background-image: radial-gradient(
      circle at 50% 0%,
      ${theme.palette.primary.main}22,
      transparent 60%
    );

    ${theme.breakpoints.down("sm")} {
      padding: ${theme.spacing(10, 4)};
    }
  `}
`;

export const SPricingTitle = styled(Heading)`
  font-size: clamp(2rem, 4.5vw, 3.25rem);
  line-height: 1.1;
  letter-spacing: -0.02em;
`;

/** Segmented control for the billing period. */
export const SPricingPeriods = styled.div`
  ${({ theme }) => `
    display: inline-flex;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(1)};
    border: 1px solid ${theme.surfaces.divider};
    border-radius: ${theme.radius.pill};
  `}
`;

export const SPricingPlans = styled.div`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: ${theme.spacing(5)};
    width: 100%;
    max-width: 880px;
    text-align: left;

    ${theme.breakpoints.down("md")} {
      grid-template-columns: minmax(0, 1fr);
    }
  `}
`;

export const SPricingSectionBody = styled(Flex)`
  ${({ theme }) => `
    width: 100%;
    gap: ${theme.spacing(10)};

    ${theme.breakpoints.down("sm")} {
      gap: ${theme.spacing(8)};
    }
  `}
`;

export const SPricingTableCard = styled(Card)`
  ${({ theme }) => `
    width: 100%;
    max-width: 880px;
    padding: ${theme.spacing(4, 6)};
    overflow-x: auto;

    ${theme.breakpoints.down("sm")} {
      padding: ${theme.spacing(2)};
    }
  `}
`;

export const SPricingTable = styled.table`
  ${({ theme }) => `
    width: 100%;
    max-width: 880px;
    border-collapse: collapse;
    color: ${theme.palette.default.main};

    & th,
    & td {
      padding: ${theme.spacing(4, 5)};
      border-bottom: 1px solid ${theme.surfaces.divider};
      text-align: center;
    }

    & th:first-child,
    & td:first-child {
      text-align: left;
    }

    & tbody th {
      font-weight: 500;
    }

    & thead th {
      font-size: 1.0625rem;
      background-color: ${theme.palette.primary.main}10;
    }

    & thead th:first-of-type {
      border-top-left-radius: ${theme.radius.md};
    }

    & thead th:last-of-type {
      border-top-right-radius: ${theme.radius.md};
    }

    ${theme.breakpoints.down("sm")} {
      font-size: 0.875rem;

      & th,
      & td {
        padding: ${theme.spacing(3, 2)};
      }
    }
  `}
`;

export const SPricingYes = styled.span`
  ${({ theme }) => `
    display: inline-flex;
    color: ${theme.palette.success.main};
    font-size: 1.25rem;
  `}
`;

export const SPricingNo = styled.span`
  ${({ theme }) => `
    color: ${theme.surfaces.muted};
  `}
`;

export const SPricingFaq = styled.div`
  width: 100%;
  max-width: 820px;
`;
