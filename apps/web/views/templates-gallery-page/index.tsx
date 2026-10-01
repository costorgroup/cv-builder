"use client";

import { useState } from "react";
import {
  Button,
  Flex,
  NativeSelect,
  Skeleton,
  Small,
  Strong,
} from "@costor/ui";
import ButtonLink from "@/components/button-link";
import TemplatePreview from "@/components/template-preview";
import { useEntitlements } from "@/providers/entitlements-provider";
import { cvEditorStepPath } from "@/utils/cv-editor";
import { useTemplateCatalog } from "@/utils/template-catalog";
import {
  STemplatesGalleryPageBadge,
  STemplatesGalleryPageCard,
  STemplatesGalleryPageCategory,
  STemplatesGalleryPageGrid,
} from "@/views/templates-gallery-page/styles";

/** A new CV that starts on `templateId`. */
const newCvWith = (templateId: string) =>
  `${cvEditorStepPath()}?template=${encodeURIComponent(templateId)}`;

/**
 * Every template on offer, with sample content. Premium ones show a lock on
 * plans without them, but can still be tried in the editor.
 */
const TemplatesGalleryPage = () => {
  const premiumLocked = !useEntitlements().can("template.premium");
  const catalog = useTemplateCatalog();
  const [category, setCategory] = useState("");

  if (catalog.status === "loading") {
    return <Skeleton width="100%" height={480} radius="lg" aria-busy />;
  }

  const categories = [
    ...new Set(
      catalog.templates.flatMap(({ category }) => (category ? [category] : [])),
    ),
  ].sort();
  const shown = category
    ? catalog.templates.filter((template) => template.category === category)
    : catalog.templates;

  return (
    <Flex direction="column" gap={5}>
      <Flex align="center" justify="space-between" gap={3} wrap="wrap">
        <Small color="secondary">
          {premiumLocked
            ? `${catalog.free.length} of ${catalog.templates.length} templates are included in your plan. The rest are part of Premium; you can still try them in the editor.`
            : `All ${catalog.templates.length} templates are included in your plan.`}
        </Small>
        {categories.length > 1 && (
          <STemplatesGalleryPageCategory>
            <NativeSelect
              aria-label="Category"
              size="sm"
              variant="subtle"
              value={category}
              options={[
                { value: "", label: "Every category" },
                ...categories.map((value) => ({ value, label: value })),
              ]}
              onChange={(_, value) => setCategory(value)}
            />
          </STemplatesGalleryPageCategory>
        )}
      </Flex>
      <STemplatesGalleryPageGrid>
        {shown.map((template) => (
          <STemplatesGalleryPageCard key={template.id} radius="lg">
            <TemplatePreview template={template} />
            {premiumLocked && template.tier === "PREMIUM" && (
              <STemplatesGalleryPageBadge />
            )}
            <Flex align="center" justify="space-between" gap={2} wrap="wrap">
              <Strong>{template.name}</Strong>
              <Button
                as={ButtonLink}
                href={newCvWith(template.id)}
                size="sm"
                variant="subtle"
                color="primary"
              >
                Use this template
              </Button>
            </Flex>
          </STemplatesGalleryPageCard>
        ))}
      </STemplatesGalleryPageGrid>
    </Flex>
  );
};

export default TemplatesGalleryPage;
