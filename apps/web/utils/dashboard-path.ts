/** The dashboard URL for a search and page; both live in the query string. */
export const dashboardPath = (search: string, page = 1) => {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (page > 1) query.set("page", String(page));
  const queryString = query.toString();
  return queryString ? `/dashboard?${queryString}` : "/dashboard";
};
