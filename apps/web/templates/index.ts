import { boldTemplate } from "@/templates/bold-template";
import { classicTemplate } from "@/templates/classic-template";
import { columnsTemplate } from "@/templates/columns-template";
import { creativeTemplate } from "@/templates/creative-template";
import { defaultTemplate } from "@/templates/default-template";
import { elegantTemplate } from "@/templates/elegant-template";
import { executiveTemplate } from "@/templates/executive-template";
import { minimalTemplate } from "@/templates/minimal-template";
import { modernTemplate } from "@/templates/modern-template";
import { techTemplate } from "@/templates/tech-template";
import { timelineTemplate } from "@/templates/timeline-template";
import type { TTemplate } from "@/templates/types";

/** Every template, in the order the Templates step lists them. */
export const templates: TTemplate[] = [
  defaultTemplate,
  modernTemplate,
  classicTemplate,
  minimalTemplate,
  executiveTemplate,
  creativeTemplate,
  columnsTemplate,
  elegantTemplate,
  techTemplate,
  timelineTemplate,
  boldTemplate,
];

export { defaultTemplate };
export * from "@/templates/utils";
export type * from "@/templates/types";
