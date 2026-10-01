import { boldTemplateSpec } from "./bold.js";
import { classicTemplateSpec } from "./classic.js";
import { columnsTemplateSpec } from "./columns.js";
import { creativeTemplateSpec } from "./creative.js";
import { defaultTemplateSpec } from "./default.js";
import { elegantTemplateSpec } from "./elegant.js";
import { executiveTemplateSpec } from "./executive.js";
import { minimalTemplateSpec } from "./minimal.js";
import { modernTemplateSpec } from "./modern.js";
import { techTemplateSpec } from "./tech.js";
import { timelineTemplateSpec } from "./timeline.js";
import type { TTemplateSpec } from "./types.js";

/** Every template's spec; the web app decides the order they're listed in. */
export const templateSpecs: TTemplateSpec[] = [
  boldTemplateSpec,
  classicTemplateSpec,
  columnsTemplateSpec,
  creativeTemplateSpec,
  defaultTemplateSpec,
  elegantTemplateSpec,
  executiveTemplateSpec,
  minimalTemplateSpec,
  modernTemplateSpec,
  techTemplateSpec,
  timelineTemplateSpec,
];

export const findTemplateSpec = (id: string): TTemplateSpec | undefined =>
  templateSpecs.find((template) => template.id === id);

export {
  boldTemplateSpec,
  classicTemplateSpec,
  columnsTemplateSpec,
  creativeTemplateSpec,
  defaultTemplateSpec,
  elegantTemplateSpec,
  executiveTemplateSpec,
  minimalTemplateSpec,
  modernTemplateSpec,
  techTemplateSpec,
  timelineTemplateSpec,
};
export * from "./sizes.js";
export type * from "./types.js";
