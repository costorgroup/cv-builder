/** The editor's steps, in order; each is a URL segment. */
export const CV_EDITOR_STEPS = [
  "templates",
  "appearance",
  "personal-information",
  "social-media",
  "work-experience",
  "education",
  "skills",
  "languages",
  "projects",
  "certificates",
  "interests",
] as const;

export type TCvEditorStep = (typeof CV_EDITOR_STEPS)[number];

export const isCvEditorStep = (value: string): value is TCvEditorStep =>
  (CV_EDITOR_STEPS as readonly string[]).includes(value);

/** Where the editor lives: a new CV, or a saved one by id. */
export const cvEditorPath = (cvId?: string) =>
  cvId ? `/dashboard/edit-cv/${cvId}` : "/dashboard/create-cv";

/** The editor at a step; the first one by default. */
export const cvEditorStepPath = (
  cvId?: string,
  step: TCvEditorStep = CV_EDITOR_STEPS[0],
) => `${cvEditorPath(cvId)}/${step}`;
