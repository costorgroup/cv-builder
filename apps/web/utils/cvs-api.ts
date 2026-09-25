import type { TCvAppearance, TCvData } from "@/providers/cv-provider/types";
import { apiRequest } from "@/utils/api-client";

/** A saved CV as the API returns it. */
export type TSavedCv = {
  id: string;
  name: string;
  data: TCvData;
  appearance: TCvAppearance;
  createdAt: string;
  updatedAt: string;
};

export type TCvList = {
  items: TSavedCv[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type TListCvsParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export const cvsApi = {
  list: ({ search, page, pageSize }: TListCvsParams, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (page) query.set("page", String(page));
    if (pageSize) query.set("pageSize", String(pageSize));
    return apiRequest<TCvList>(`cvs?${query}`, {
      method: "GET",
      authenticated: true,
      signal,
    });
  },
  get: (id: string) =>
    apiRequest<TSavedCv>(`cvs/${id}`, { method: "GET", authenticated: true }),
  create: (body: Pick<TSavedCv, "name" | "data" | "appearance">) =>
    apiRequest<TSavedCv>("cvs", { body, authenticated: true }),
  update: (
    id: string,
    body: Partial<Pick<TSavedCv, "name" | "data" | "appearance">>,
  ) =>
    apiRequest<TSavedCv>(`cvs/${id}`, {
      method: "PATCH",
      body,
      authenticated: true,
    }),
  remove: (id: string) =>
    apiRequest(`cvs/${id}`, { method: "DELETE", authenticated: true }),
};
