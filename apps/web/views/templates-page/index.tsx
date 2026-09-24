"use client";

import { useMemo, useState } from "react";
import { Flex, GridCell, SearchIcon, Small, TextField } from "@costor/ui";
import { findCvFont } from "@/fonts";
import { CvPlaceholders } from "@/providers/cv-provider";
import { useCv } from "@/providers/cv-provider/context";
import { getDefaultSizes, templates } from "@/templates";
import {
  STemplatesPageCard,
  STemplatesPageGrid,
  STemplatesPagePreview,
  STemplatesPageSelect,
} from "@/views/templates-page/styles";
import type { TTemplatesPageProps } from "@/views/templates-page/types";

const TemplatesPage = ({ ...props }: TTemplatesPageProps) => {
  const { template, setTemplateId, colors, sizes, typography } = useCv();
  const [search, setSearch] = useState("");

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? templates.filter(({ name }) => name.toLowerCase().includes(query))
      : templates;
  }, [search]);

  return (
    <Flex direction="column" gap={2.5} {...props}>
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
      {filteredTemplates.length === 0 ? (
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
