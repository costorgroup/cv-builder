"use client";

import type { TPersonalInformationPageProps } from "@/views/personal-information-page/types";
import { useMemo, useRef } from "react";
import { Flex, GridCell } from "@costor/ui";
import { CvTextArea, CvTextField } from "@/components/cv-form-fields";
import CvLocationFields from "@/components/cv-location-fields";
import {
  SPersonalInformationPageDropzone,
  SPersonalInformationPageGrid,
  SPersonalInformationPagePhoto,
} from "@/views/personal-information-page/styles";
import { useCvEditorEnv } from "@/providers/cv-editor-env";
import { useCv } from "@/providers/cv-provider/context";
import { assetsApi } from "@/utils/assets-api";
import { dataUrlToFile, readImageAsDataUrl } from "@/utils/read-image";

const PersonalInformationPage = ({
  ...props
}: TPersonalInformationPageProps) => {
  const { data, updateCvData } = useCv();
  const { uploadPhoto = assetsApi.uploadPhoto } = useCvEditorEnv();
  const { photo } = data.personalInformation;
  // The latest pick; an earlier upload finishing late doesn't replace it.
  const latestPick = useRef(0);

  // The dropzone is controlled, so it still shows the photo after leaving
  // and coming back; the preview below draws the photo itself.
  const photoFiles = useMemo(
    () => (photo ? [new File([], "photo.jpg", { type: "image/jpeg" })] : []),
    [photo],
  );

  const onPhotoFiles = async ([file]: File[]) => {
    if (!file) return;
    const pick = ++latestPick.current;
    let dataUrl: string;
    try {
      dataUrl = await readImageAsDataUrl(file);
    } catch {
      // Not an image the browser can read; keep the current photo.
      return;
    }
    // Shown at once, scaled down; then stored as a file and linked, so the
    // CV doesn't carry the image itself.
    updateCvData("personalInformation", { photo: dataUrl });
    try {
      const { url } = await uploadPhoto(dataUrlToFile(dataUrl, "photo.jpg"));
      if (pick === latestPick.current) {
        updateCvData("personalInformation", { photo: url });
      }
    } catch {
      // Kept inline for now; saving the CV stores it as a file.
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
            // A stored upload (or one still uploading), not a static asset.
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
        <CvLocationFields />
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
