/** The admin area's pages. */
export const ADMIN_PATH = "/admin";
export const ADMIN_USERS_PATH = "/admin/users";
export const ADMIN_SUBSCRIPTIONS_PATH = "/admin/subscriptions";
export const ADMIN_PLANS_PATH = "/admin/plans";
export const ADMIN_TEMPLATES_PATH = "/admin/templates";
export const ADMIN_USAGE_PATH = "/admin/usage";
export const ADMIN_AUDIT_LOG_PATH = "/admin/audit-log";

export const adminUserPath = (id: string) => `${ADMIN_USERS_PATH}/${id}`;
export const adminPlanPath = (id: string) => `${ADMIN_PLANS_PATH}/${id}`;
