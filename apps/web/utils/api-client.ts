/** An error response from the API, with a message fit to show the user. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** The whole error body, e.g. the `code` and usage of a plan refusal. */
    readonly body: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export type TApiRequestOptions = {
  body?: unknown;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** Signed-in routes; retried once after refreshing an expired session. */
  authenticated?: boolean;
  signal?: AbortSignal;
  /** How to read a successful response; JSON unless it's a file. */
  responseType?: "json" | "blob";
};

const readError = async (response: Response) => {
  try {
    const body = (await response.json()) as Record<string, unknown>;
    // Nest sends `message` as a string, or a list for validation errors.
    const { message } = body as { message?: string | string[] };
    return { body, message: Array.isArray(message) ? message[0] : message };
  } catch {
    return { body: {}, message: undefined };
  }
};

const refreshSession = async () =>
  (await fetch("/api/auth/refresh", { method: "POST" })).ok;

/** Calls `/api/<path>` (proxied to Nest); session cookies go along. */
export const apiRequest = async <T = void>(
  path: string,
  {
    body,
    method = "POST",
    authenticated = false,
    signal,
    responseType = "json",
  }: TApiRequestOptions = {},
): Promise<T> => {
  // A file upload goes as it is; the browser sets its multipart headers.
  const isForm = body instanceof FormData;
  const send = () =>
    fetch(`/api/${path}`, {
      method,
      headers:
        body && !isForm ? { "Content-Type": "application/json" } : undefined,
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
      signal,
    });

  let response = await send();
  if (response.status === 401 && authenticated && (await refreshSession())) {
    response = await send();
  }
  if (!response.ok) {
    const { body, message } = await readError(response);
    throw new ApiError(
      response.status,
      message ?? "Something went wrong. Try again.",
      body,
    );
  }
  if (response.status === 204) return undefined as T;
  return (
    responseType === "blob" ? await response.blob() : await response.json()
  ) as T;
};
