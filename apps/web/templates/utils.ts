import type {
  TTemplate,
  TTemplateGroup,
  TTemplateSection,
  TTemplateSizes,
} from "@/templates/types";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const minOf = (section: TTemplateSection) => section.size.min ?? 0;
const maxOf = (section: TTemplateSection) => section.size.max ?? 100;

export const getDefaultSizes = (template: TTemplate): TTemplateSizes =>
  Object.fromEntries(
    template.groups.map((group) => [
      group.id,
      Object.fromEntries(
        group.sections.map((section) => [section.id, section.size.value]),
      ),
    ]),
  );

/** Size of a section in percent, falling back to the template default. */
export const getSectionSize = (
  sizes: TTemplateSizes,
  groupId: string,
  sectionId: string,
  fallback = 0,
) => sizes[groupId]?.[sectionId] ?? fallback;

/**
 * Sets one section to `requested` percent and gives the difference to its
 * siblings (next ones first, then previous ones), respecting every
 * section's min/max. The group total stays at 100%.
 */
export const resizeSection = (
  group: TTemplateGroup,
  current: Record<string, number>,
  sectionId: string,
  requested: number,
): Record<string, number> => {
  const index = group.sections.findIndex(({ id }) => id === sectionId);
  const section = group.sections[index];
  if (!section) return current;

  const others = [
    ...group.sections.slice(index + 1),
    ...group.sections.slice(0, index).reverse(),
  ];
  const othersMin = others.reduce((sum, other) => sum + minOf(other), 0);
  const othersMax = others.reduce((sum, other) => sum + maxOf(other), 0);

  const value = clamp(
    requested,
    Math.max(minOf(section), 100 - othersMax),
    Math.min(maxOf(section), 100 - othersMin),
  );

  const next = { ...current, [sectionId]: value };
  let remaining = (current[sectionId] ?? section.size.value) - value;

  for (const other of others) {
    if (remaining === 0) break;
    const size = next[other.id] ?? other.size.value;
    const target = clamp(size + remaining, minOf(other), maxOf(other));
    remaining -= target - size;
    next[other.id] = target;
  }

  return next;
};
