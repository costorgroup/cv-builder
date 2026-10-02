/** The dashboard's overview; where signed-in users land. */
export const DASHBOARD_PATH = "/dashboard";

/** The list of the user's CVs. */
export const MY_CVS_PATH = "/dashboard/cvs";

export const TEMPLATES_PATH = "/dashboard/templates";
export const USAGE_PATH = "/dashboard/usage";
export const SUBSCRIPTION_PATH = "/dashboard/subscription";
export const ACCOUNT_PATH = "/dashboard/account";
export const SECURITY_PATH = "/dashboard/security";
/** API keys for connecting other apps. */
export const DEVELOPERS_PATH = "/dashboard/developers";
/** Embedded builders for other sites. */
export const EMBEDS_PATH = "/dashboard/embeds";
/** Where files are kept, and an own bucket. */
export const STORAGE_PATH = "/dashboard/storage";

/** My CVs for a search and page; both live in the query string. */
export const myCvsPath = (search: string, page = 1) => {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (page > 1) query.set("page", String(page));
  const queryString = query.toString();
  return queryString ? `${MY_CVS_PATH}?${queryString}` : MY_CVS_PATH;
};
