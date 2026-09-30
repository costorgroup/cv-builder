import styled from "@emotion/styled";
import { Section, sectionContentClasses } from "@costor/ui";

export const SSiteSection = styled(Section)`
  /* Clear of the sticky top bar when scrolled to. */
  scroll-margin-top: 120px;

  /* Full width even when centered, so wide content (marquee, tables) is held
     to the container instead of setting its own width. */
  & > .${sectionContentClasses.root} {
    align-self: stretch;
    width: 100%;
    min-width: 0;
  }
`;
