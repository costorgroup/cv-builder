"use client";

import { useMemo, useState } from "react";
import {
  Flex,
  GridCell,
  SearchIcon,
  Skeleton,
  Small,
  TextField,
} from "@costor/ui";
import LockedFeaturesNotice from "@/components/locked-features-notice";
import { findCvFont } from "@/fonts";
import { CvPlaceholders } from "@/providers/cv-provider";
import { useCv } from "@/providers/cv-provider/context";
import { useEntitlements } from "@/providers/entitlements-provider";
import { getDefaultSizes, type TTemplate } from "@/templates";
import { useTemplateCatalog } from "@/utils/template-catalog";
import {
  STemplatesPageBadge,
  STemplatesPageCard,
  STemplatesPageGrid,
  STemplatesPagePreview,
  STemplatesPageSelect,
} from "@/views/templates-page/styles";
import type { TTemplatesPageProps } from "@/views/templates-page/types";

const TemplatesPage = ({ ...props }: TTemplatesPageProps) => {
  const { template, setTemplateId, colors, sizes, typography } = useCv();
  const [search, setSearch] = useState("");
  const premiumLocked = !useEntitlements().can("template.premium");
  const catalog = useTemplateCatalog();

  // The templates on offer, and the CV's own one if it's no longer offered
  // (it can keep it, but not switch back once it leaves).
  const offered = useMemo<TTemplate[]>(() => {
    if (catalog.status === "loading") return [];
    return catalog.templates.some(({ id }) => id === template.id)
      ? catalog.templates
      : [...catalog.templates, template];
  }, [catalog, template]);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? offered.filter(({ name }) => name.toLowerCase().includes(query))
      : offered;
  }, [offered, search]);

  const isLocked = (id: string) =>
    premiumLocked && catalog.status !== "loading" && !catalog.free.includes(id);

  return (
    <Flex direction="column" gap={2.5} {...props}>
      <LockedFeaturesNotice />
      <TextField
        type="search"
        placeholder="Search templates"
        aria-label="Search templates"
        variant="subtle"
        size="sm"
        startIcon={<SearchIcon />}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {catalog.status === "loading" ? (
        <STemplatesPageGrid columns={2} gap={4} aria-busy>
          {[0, 1, 2, 3].map((index) => (
            <GridCell key={index}>
              <Skeleton width="100%" height={220} />
            </GridCell>
          ))}
        </STemplatesPageGrid>
      ) : filteredTemplates.length === 0 ? (
        <Small>No templates match &quot;{search.trim()}&quot;.</Small>
      ) : (
        <CvPlaceholders>
          <STemplatesPageGrid columns={2} gap={4}>
            {filteredTemplates.map((item) => {
              const selected = item.id === template.id;

              // The selected template shows the current appearance; others show
              // their defaults.
              const preview = selected
                ? item.render({ colors, sizes, typography })
                : item.render({
                    colors: item.colorSchemes[0].colors,
                    sizes: getDefaultSizes(item),
                    typography: {
                      fontFamily: findCvFont(item.defaultFontId).family,
                      fontScale: 1,
                    },
                  });

              return (
                <GridCell key={item.id}>
                  <STemplatesPageCard selected={selected}>
                    <STemplatesPagePreview aria-hidden>
                      {preview}
                    </STemplatesPagePreview>
                    <Small>{item.name}</Small>
                    {isLocked(item.id) && <STemplatesPageBadge />}
                    <STemplatesPageSelect
                      type="button"
                      aria-label={`Use ${item.name} template`}
                      aria-pressed={selected}
                      onClick={() => !selected && setTemplateId(item.id)}
                    />
                  </STemplatesPageCard>
                </GridCell>
              );
            })}
          </STemplatesPageGrid>
        </CvPlaceholders>
      )}
    </Flex>
  );
};

export default TemplatesPage;
