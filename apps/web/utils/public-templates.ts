import type { TPublicTemplate } from "@repo/cv-core";

/** The Nest API, reached directly from the server (as in next.config.js). */
const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

/** How long the server reuses the list; publishing shows up within this. */
const REVALIDATE_SECONDS = 60;

/**
 * The published templates, for server-rendered pages; null if the API can't
 * be reached, so the page can fall back to every template.
 */
export const getPublicTemplates = async (): Promise<
  TPublicTemplate[] | null
> => {
  try {
    const response = await fetch(`${API_URL}/templates`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    return response.ok ? ((await response.json()) as TPublicTemplate[]) : null;
  } catch {
    return null;
  }
};
