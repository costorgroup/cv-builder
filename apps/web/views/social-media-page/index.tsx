"use client";

import { GridCell } from "@costor/ui";
import { CvTextField } from "@/components/cv-form-fields";
import type { TCvSocialMedia } from "@/providers/cv-provider/types";
import { SSocialMediaPageGrid } from "@/views/social-media-page/styles";
import type { TSocialMediaPageProps } from "@/views/social-media-page/types";

const socialMediaFields: { name: keyof TCvSocialMedia; label: string }[] = [
  { name: "linkedin", label: "LinkedIn" },
  { name: "github", label: "GitHub" },
  { name: "website", label: "Website" },
  { name: "twitter", label: "Twitter" },
  { name: "facebook", label: "Facebook" },
  { name: "instagram", label: "Instagram" },
  { name: "youtube", label: "YouTube" },
];

const SocialMediaPage = ({ ...props }: TSocialMediaPageProps) => (
  <SSocialMediaPageGrid columns={1} gap={2} {...props}>
    {socialMediaFields.map(({ name, label }) => (
      <GridCell key={name}>
        <CvTextField
          name={`socialMedia.${name}`}
          label={label}
          variant="subtle"
          size="sm"
        />
      </GridCell>
    ))}
  </SSocialMediaPageGrid>
);

export default SocialMediaPage;
