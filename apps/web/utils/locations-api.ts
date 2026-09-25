import { apiRequest } from "@/utils/api-client";

export type TCountry = { code: string; name: string };
export type TState = { id: number; name: string };
export type TCity = {
  id: number;
  name: string;
  state: { name: string } | null;
};

export type TSearchCitiesParams = {
  /** ISO 3166-1 alpha-2 code. */
  country: string;
  state?: number;
  search?: string;
  limit?: number;
};

// Countries and states only change when the API is re-seeded, so each list is
// fetched once per page load. A failed request is forgotten, so it's retried.
let countriesRequest: Promise<TCountry[]> | undefined;
const statesRequests = new Map<string, Promise<TState[]>>();

const once = <T>(
  get: () => Promise<T> | undefined,
  set: (request: Promise<T> | undefined) => void,
  load: () => Promise<T>,
) => {
  const cached = get();
  if (cached) return cached;
  const request = load().catch((error: unknown) => {
    set(undefined);
    throw error;
  });
  set(request);
  return request;
};

export const locationsApi = {
  countries: () =>
    once(
      () => countriesRequest,
      (request) => (countriesRequest = request),
      () => apiRequest<TCountry[]>("locations/countries", { method: "GET" }),
    ),
  states: (countryCode: string) =>
    once(
      () => statesRequests.get(countryCode),
      (request) =>
        request
          ? statesRequests.set(countryCode, request)
          : statesRequests.delete(countryCode),
      () =>
        apiRequest<TState[]>(`locations/countries/${countryCode}/states`, {
          method: "GET",
        }),
    ),
  cities: (
    { country, state, search, limit }: TSearchCitiesParams,
    signal?: AbortSignal,
  ) => {
    const query = new URLSearchParams({ country });
    if (state !== undefined) query.set("state", String(state));
    if (search) query.set("search", search);
    if (limit) query.set("limit", String(limit));
    return apiRequest<TCity[]>(`locations/cities?${query}`, {
      method: "GET",
      signal,
    });
  },
};
