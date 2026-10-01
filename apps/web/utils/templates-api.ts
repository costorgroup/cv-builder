import type { TPublicTemplate } from "@repo/cv-core";
import { apiRequest } from "@/utils/api-client";

export const templatesApi = {
  /** Published templates in order, each free or premium. */
  list: (signal?: AbortSignal) =>
    apiRequest<TPublicTemplate[]>("templates", { method: "GET", signal }),
};
