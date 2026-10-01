import styled from "@emotion/styled";
import { Card } from "@costor/ui";
import PremiumBadge from "@/components/premium-badge";

export const STemplatesGalleryPageGrid = styled.div`
  ${({ theme }) => `
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
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

export const STemplatesGalleryPageCard = styled(Card)`
  ${({ theme }) => `
    position: relative;
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(3)};
    padding: ${theme.spacing(2.5)};
    min-width: 0;
  `}
`;

/** Over the preview's top corner, for templates the plan doesn't include. */
export const STemplatesGalleryPageBadge = styled(PremiumBadge)`
  ${({ theme }) => `
    position: absolute;
    top: ${theme.spacing(4)};
    right: ${theme.spacing(4)};
  `}
`;

export const STemplatesGalleryPageCategory = styled.div`
  width: 180px;
`;
