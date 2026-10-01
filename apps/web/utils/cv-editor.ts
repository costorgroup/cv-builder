import { CV_EDITOR_STEPS, type TCvEditorStep } from "@repo/cv-core";

export {
  CV_EDITOR_STEPS,
  isCvEditorStep,
  type TCvEditorStep,
} from "@repo/cv-core";

/** Where the editor lives: a new CV, or a saved one by id. */
export const cvEditorPath = (cvId?: string) =>
  cvId ? `/dashboard/edit-cv/${cvId}` : "/dashboard/create-cv";

/** The editor at a step; the first one by default. */
export const cvEditorStepPath = (
  cvId?: string,
  step: TCvEditorStep = CV_EDITOR_STEPS[0],
) => `${cvEditorPath(cvId)}/${step}`;
