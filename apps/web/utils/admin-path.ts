/** The admin area's pages, part of the dashboard; admins only. */
export const ADMIN_PATH = "/dashboard/admin";
export const ADMIN_USERS_PATH = `${ADMIN_PATH}/users`;
export const ADMIN_SUBSCRIPTIONS_PATH = `${ADMIN_PATH}/subscriptions`;
export const ADMIN_PLANS_PATH = `${ADMIN_PATH}/plans`;
export const ADMIN_TEMPLATES_PATH = `${ADMIN_PATH}/templates`;
export const ADMIN_EMBEDS_PATH = `${ADMIN_PATH}/embeds`;
export const ADMIN_USAGE_PATH = `${ADMIN_PATH}/usage`;
export const ADMIN_AUDIT_LOG_PATH = `${ADMIN_PATH}/audit-log`;

export const adminUserPath = (id: string) => `${ADMIN_USERS_PATH}/${id}`;
export const adminPlanPath = (id: string) => `${ADMIN_PLANS_PATH}/${id}`;
