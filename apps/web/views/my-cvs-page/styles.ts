import styled from "@emotion/styled";
import { Flex } from "@costor/ui";

export const SMyCvsPage = styled(Flex)`
  width: 100%;
`;

/** CVs used against the plan's limit, above the grid. */
export const SMyCvsPageHeader = styled(Flex)`
  width: 100%;
`;

export const SMyCvsPageGrid = styled.div`
  ${({ theme }) => `
    display: grid;
    /* Column counts that divide the page size (12), so rows come out even. */
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: ${theme.spacing(4)};

    ${theme.breakpoints.down("xl")} {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    ${theme.breakpoints.down("lg")} {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    ${theme.breakpoints.down("md")} {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `}
`;
