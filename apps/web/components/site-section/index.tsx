"use client";

import { useId } from "react";
import type { TSectionProps } from "@costor/ui";
import { SSiteSection } from "@/components/site-section/styles";

/**
 * A public-page section inside a SectionGroup. Its `title` is the section's
 * heading (level 2, under the page's h1) and names the section.
 */
export const SiteSection = ({ slotProps, title, ...props }: TSectionProps) => {
  const titleId = useId();

  return (
    <SSiteSection
      title={title}
      aria-labelledby={title ? titleId : undefined}
      slotProps={{
        ...slotProps,
        title: {
          id: titleId,
          role: "heading",
          "aria-level": 2,
          ...slotProps?.title,
        },
      }}
      {...props}
    />
  );
};

export default SiteSection;
