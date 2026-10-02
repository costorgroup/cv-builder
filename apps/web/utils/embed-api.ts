import { EMBED_EVENTS, type TResolvedEmbedConfig } from "@repo/cv-core";
import { ApiError } from "@/utils/api-client";
import type { TCvList, TListCvsParams, TSavedCv } from "@/utils/cvs-api";
import type { TCvPdfSource } from "@/utils/download-cv-pdf";

/**
 * The embedded builder's session token: in memory only (no cookies, which
 * browsers block in frames, and nothing a page could read back later).
 */
let sessionToken: string | undefined;

/** The page showing the embed, once known, for telling it what happened. */
let parentOrigin: string | undefined;

export const setEmbedParent = (origin: string) => {
  parentOrigin = origin;
};

/** Tells the page showing the embed, and only that page. */
export const notifyEmbedParent = (type: string, detail?: unknown) => {
  if (parentOrigin && window.parent !== window) {
    window.parent.postMessage({ type, detail }, parentOrigin);
  }
};

const readError = async (response: Response) => {
  try {
    const body = (await response.json()) as Record<string, unknown>;
    const { message } = body as { message?: string | string[] };
    return { body, message: Array.isArray(message) ? message[0] : message };
  } catch {
    return { body: {}, message: undefined };
  }
};

/** Calls the embed API with the session; an expired one is reported up. */
const embedRequest = async <T>(
  path: string,
  {
    method = "GET",
    body,
    blob = false,
    signal,
  }: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    blob?: boolean;
    signal?: AbortSignal;
  } = {},
): Promise<T> => {
  const headers: Record<string, string> = {};
  const isForm = body instanceof FormData;
  if (body && !isForm) headers["Content-Type"] = "application/json";
  if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
  // Lets the API check the page showing the embed is one it allows.
  if (parentOrigin) headers["X-Embed-Parent-Origin"] = parentOrigin;
  const response = await fetch(`/api/embed/v1/${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
    signal,
  });
  if (!response.ok) {
    if (response.status === 401) {
      sessionToken = undefined;
      notifyEmbedParent(EMBED_EVENTS.sessionExpired);
    }
    const { body: errorBody, message } = await readError(response);
    throw new ApiError(
      response.status,
      message ?? "Something went wrong. Try again.",
      errorBody,
    );
  }
  if (response.status === 204) return undefined as T;
  return (blob ? await response.blob() : await response.json()) as T;
};

export const embedApi = {
  /** Trades a launch token for a session; keeps the session. */
  exchange: async (publicKey: string, launchToken: string) => {
    const result = await embedRequest<{
      embedToken: string;
      expiresIn: number;
      config: TResolvedEmbedConfig;
    }>("sessions/exchange", {
      method: "POST",
      body: { publicKey, launchToken },
    });
    sessionToken = result.embedToken;
    return result.config;
  },
  hasSession: () => !!sessionToken,
  /** Public: the sites allowed to show the embed; 404 if it's unavailable. */
  frames: async (publicKey: string) => {
    const response = await fetch(
      `/api/embed/v1/frames/${encodeURIComponent(publicKey)}`,
    );
    if (!response.ok) throw new ApiError(response.status, "Not available");
    return (await response.json()) as { allowedOrigins: string[] };
  },
  list: ({ search, page, pageSize }: TListCvsParams, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (page) query.set("page", String(page));
    if (pageSize) query.set("pageSize", String(pageSize));
    return embedRequest<TCvList>(`cvs?${query}`, { signal });
  },
  get: (id: string) => embedRequest<TSavedCv>(`cvs/${id}`),
  save: (
    cvId: string | undefined,
    body: Pick<TSavedCv, "name" | "data" | "appearance">,
  ) =>
    cvId
      ? embedRequest<TSavedCv>(`cvs/${cvId}`, { method: "PATCH", body })
      : embedRequest<TSavedCv>("cvs", { method: "POST", body }),
  remove: (id: string) => embedRequest(`cvs/${id}`, { method: "DELETE" }),
  uploadPhoto: (file: Blob) => {
    const form = new FormData();
    form.append("file", file, "photo.jpg");
    return embedRequest<{ id: string; url: string }>("assets/photos", {
      method: "POST",
      body: form,
    });
  },
  pdf: (source: TCvPdfSource) =>
    "id" in source
      ? embedRequest<Blob>(`cvs/${source.id}/pdf`, {
          method: "POST",
          blob: true,
        })
      : embedRequest<Blob>("cvs/draft-pdf", {
          method: "POST",
          body: source,
          blob: true,
        }),
};
