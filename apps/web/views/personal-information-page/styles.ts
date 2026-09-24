import { Dropzone, dropzoneClasses, Flex, Grid } from "@costor/ui";
import styled from "@emotion/styled";

export const SPersonalInformationPagePhoto = styled(Flex)`
  padding-bottom: ${({ theme }) => theme.spacing(2.5)};
`;

// A round 200×200 dropzone that shows the photo itself once one is set.
export const SPersonalInformationPageDropzone = styled(Dropzone)`
  && {
    width: 200px;
    height: 200px;
    flex-shrink: 0;
    border-radius: 50%;
  }

  .${dropzoneClasses.preview} {
    height: 100%;
  }

  .${dropzoneClasses.preview} img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const SPersonalInformationPageGrid = styled(Grid)`
  padding: ${({ theme }) => theme.spacing(2.5)} 0;
`;
