export type TSearchParams = Promise<Record<string, string | string[] | undefined>>;

/** A query parameter's first value, if any. */
export const getSearchParam = async (
  searchParams: TSearchParams,
  name: string,
) => {
  const value = (await searchParams)[name];
  return Array.isArray(value) ? value[0] : value;
};
