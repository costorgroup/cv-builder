"use client";

import type { TPersonalInformationPageProps } from "@/views/personal-information-page/types";
import { useMemo } from "react";
import { Flex, GridCell } from "@costor/ui";
import { CvTextArea, CvTextField } from "@/components/cv-form-fields";
import {
  SPersonalInformationPageDropzone,
  SPersonalInformationPageGrid,
  SPersonalInformationPagePhoto,
} from "@/views/personal-information-page/styles";
import { useCv } from "@/providers/cv-provider/context";
import { dataUrlToFile, readImageAsDataUrl } from "@/utils/read-image";

const PersonalInformationPage = ({
  ...props
}: TPersonalInformationPageProps) => {
  const { data, updateCvData } = useCv();
  const { photo } = data.personalInformation;

  // The photo lives in the form as a data URL; the dropzone is controlled
  // with it, so it still shows the photo after leaving and coming back.
  const photoFiles = useMemo(
    () => (photo ? [dataUrlToFile(photo, "photo.jpg")] : []),
    [photo],
  );

  const onPhotoFiles = async ([file]: File[]) => {
    if (!file) return;
    try {
      updateCvData("personalInformation", {
        photo: await readImageAsDataUrl(file),
      });
    } catch {
      // Not an image the browser can read; keep the current photo.
    }
  };

  return (
    <Flex direction="column" {...props}>
      <SPersonalInformationPagePhoto justify="center">
        <SPersonalInformationPageDropzone
          accept="image/*"
          variant="subtle"
          size="sm"
          padding={photo ? 0 : undefined}
          title="Photo"
          description="Drop or click"
          files={photoFiles}
          onFiles={onPhotoFiles}
          onRemove={() => updateCvData("personalInformation", { photo: "" })}
          renderPreview={() => (
            // The photo is a data URL, not a static asset.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Photo" />
          )}
        />
      </SPersonalInformationPagePhoto>
      <SPersonalInformationPageGrid columns={2} gap={2}>
        <GridCell>
          <CvTextField
            name="personalInformation.firstName"
            label="First Name"
            variant="subtle"
            size="sm"
            required
          />
        </GridCell>
        <GridCell>
          <CvTextField
            name="personalInformation.lastName"
            label="Last Name"
            variant="subtle"
            size="sm"
            required
          />
        </GridCell>
        <GridCell colSpan={2}>
          <CvTextField
            name="personalInformation.email"
            label="Email"
            variant="subtle"
            size="sm"
            required
          />
        </GridCell>
        <GridCell colSpan={2}>
          <CvTextField
            name="personalInformation.phone"
            label="Phone"
            variant="subtle"
            size="sm"
            required
          />
        </GridCell>
        <GridCell colSpan={2}>
          <CvTextField
            name="personalInformation.address"
            label="Address"
            variant="subtle"
            size="sm"
            required
          />
        </GridCell>
        <GridCell colSpan={2}>
          <CvTextArea
            name="personalInformation.aboutMe"
            label="About Me"
            variant="subtle"
            size="sm"
            rows={5}
            autoGrow
            required
          />
        </GridCell>
      </SPersonalInformationPageGrid>
    </Flex>
  );
};

export default PersonalInformationPage;
