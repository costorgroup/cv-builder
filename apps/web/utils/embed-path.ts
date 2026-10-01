/** An embed's home: the end user's CVs. */
export const embedPath = (publicKey: string) =>
  `/embed/${encodeURIComponent(publicKey)}`;

/** The embedded editor for a CV, or a new one (without the step). */
export const embedEditorPath = (publicKey: string, cvId?: string) =>
  `${embedPath(publicKey)}/cv/${cvId ? encodeURIComponent(cvId) : "new"}`;
