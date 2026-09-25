/** An error response from the API, with a message fit to show the user. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
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
};

const readError = async (response: Response) => {
  try {
    // Nest sends `message` as a string, or a list for validation errors.
    const { message } = (await response.json()) as {
      message?: string | string[];
    };
    return Array.isArray(message) ? message[0] : message;
  } catch {
    return undefined;
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
  }: TApiRequestOptions = {},
): Promise<T> => {
  const send = () =>
    fetch(`/api/${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

  let response = await send();
  if (response.status === 401 && authenticated && (await refreshSession())) {
    response = await send();
  }
  if (!response.ok) {
    throw new ApiError(
      response.status,
      (await readError(response)) ?? "Something went wrong. Try again.",
    );
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
};
