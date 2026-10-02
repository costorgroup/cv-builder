import type {
  TAccountOverview,
  TTemplateStatus,
  TTemplateTier,
} from "@repo/cv-core";
import { apiRequest } from "@/utils/api-client";
import type { TAuthUser } from "@/utils/auth-api";

export type TPlatformRole = TAuthUser["role"];

export type TAdminStats = {
  users: {
    total: number;
    activeLast30Days: number;
    disabled: number;
    newThisMonth: number;
  };
  cvs: { total: number; newThisMonth: number };
  storageBytes: number;
  pdfsThisMonth: number;
  subscriptions: {
    paid: number;
    pastDue: number;
    endingAtPeriodEnd: number;
    byPlan: Record<string, number>;
  };
  /** Currency → cents a month, before tax and fees. */
  estimatedMonthlyRevenue: Record<string, number>;
};

/** The plan part of a user, as the user list and detail show it. */
type TAdminUserSubscription = {
  status: string;
  provider: string;
  plan: { key: string; name: string };
};

export type TAdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: TPlatformRole;
  emailVerifiedAt: string | null;
  disabledAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  cvCount: number;
  subscription: TAdminUserSubscription | null;
};

export type TAdminUserList = {
  items: TAdminUser[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type TAuditLogEntry = {
  id: string;
  actorType: "USER" | "API_KEY" | "EXTERNAL_USER" | "SYSTEM";
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
};

export type TAdminUserDetail = Omit<TAdminUser, "cvCount" | "subscription"> & {
  activeSessions: number;
  memberships: {
    role: string;
    organization: { id: string; name: string; type: string };
  }[];
  subscription:
    | (TAdminUserSubscription & {
        id: string;
        providerSubscriptionId: string | null;
        currentPeriodEnd: string | null;
        cancelAtPeriodEnd: boolean;
        overrides: unknown;
        price: { period: string } | null;
      })
    | null;
  usage: TAccountOverview["usage"] | null;
  recentActivity: TAuditLogEntry[];
};

export type TAdminUserQuery = {
  search?: string;
  /** Any of these; everyone when empty. */
  status?: ("active" | "disabled")[];
  /** Any of these; everyone when empty. */
  role?: TPlatformRole[];
  page?: number;
  /** Up to 500. */
  pageSize?: number;
};

export const adminApi = {
  stats: () =>
    apiRequest<TAdminStats>("admin/stats", {
      method: "GET",
      authenticated: true,
    }),
  users: (query: TAdminUserQuery, signal?: AbortSignal) =>
    get<TAdminUserList>(`admin/users?${queryString(query)}`, signal),
  user: (id: string) =>
    apiRequest<TAdminUserDetail>(`admin/users/${id}`, {
      method: "GET",
      authenticated: true,
    }),
  /** Disabling also signs the user out everywhere. */
  setDisabled: (id: string, disabled: boolean) =>
    apiRequest(`admin/users/${id}/disabled`, {
      method: "PATCH",
      body: { disabled },
      authenticated: true,
    }),
  /** Super admins only. */
  setRole: (id: string, role: TPlatformRole) =>
    apiRequest(`admin/users/${id}/role`, {
      method: "PATCH",
      body: { role },
      authenticated: true,
    }),
};

export type TEntitlementValues = {
  features: string[];
  /** Limit → maximum, or null for unlimited. */
  limits: Record<string, number | null>;
};

export type TAdminSubscription = {
  id: string;
  status: string;
  provider: string;
  providerSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  overrides: Partial<TEntitlementValues> | null;
  updatedAt: string;
  plan: { key: string; name: string };
  price: { period: string; amountCents: number; currency: string } | null;
  organization: {
    id: string;
    name: string;
    type: string;
    personalOwner: { id: string; email: string } | null;
  };
};

export type TAdminPlanPrice = {
  id: string;
  period: "MONTHLY" | "QUARTERLY" | "YEARLY";
  amountCents: number;
  currency: string;
  providerPriceId: string | null;
  active: boolean;
  createdAt: string;
};

export type TAdminPlan = TEntitlementValues & {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isPublic: boolean;
  sortOrder: number;
  archivedAt: string | null;
  providerProductId: string | null;
  prices: TAdminPlanPrice[];
  /** Accounts on it. */
  subscriptions: number;
};

export type TAdminUsage = {
  /** "2026-09", oldest first; the lists below follow these. */
  months: string[];
  signups: number[];
  cvsCreated: number[];
  pdfsGenerated: number[];
  mostCvs: { userId: string | null; email: string | null; cvs: number }[];
  mostStorage: { userId: string | null; email: string | null; bytes: number }[];
};

export type TAuditLogPage = {
  items: TAuditLogEntry[];
  /** User id → email, for people who still have an account. */
  emails: Record<string, string>;
  total: number;
  page: number;
  pageCount: number;
};

type TPageQuery = Record<
  string,
  string | number | boolean | readonly string[] | undefined
>;

/** Lists go as "a,b", as the API's list filters take them; empty ones not at all. */
const queryString = (query: TPageQuery) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const text = Array.isArray(value) ? value.join(",") : value;
    if (text !== undefined && text !== "") params.set(key, String(text));
  }
  return params.toString();
};

const get = <T>(path: string, signal?: AbortSignal) =>
  apiRequest<T>(path, { method: "GET", authenticated: true, signal });

export const adminBillingApi = {
  subscriptions: (query: TPageQuery, signal?: AbortSignal) =>
    get<{
      items: TAdminSubscription[];
      total: number;
      page: number;
      pageCount: number;
    }>(`admin/subscriptions?${queryString(query)}`, signal),
  /** Super admins only; empty clears them. */
  setOverrides: (subscriptionId: string, body: Partial<TEntitlementValues>) =>
    apiRequest(`admin/subscriptions/${subscriptionId}/overrides`, {
      method: "PATCH",
      body,
      authenticated: true,
    }),
  plans: () => get<TAdminPlan[]>("admin/plans"),
  updatePlan: (
    id: string,
    body: Partial<
      Pick<TAdminPlan, "name" | "description" | "isPublic" | "sortOrder"> &
        TEntitlementValues & { archived: boolean }
    >,
  ) =>
    apiRequest(`admin/plans/${id}`, {
      method: "PATCH",
      body,
      authenticated: true,
    }),
  addPrice: (
    planId: string,
    body: Pick<TAdminPlanPrice, "period" | "amountCents" | "currency">,
  ) =>
    apiRequest<TAdminPlanPrice>(`admin/plans/${planId}/prices`, {
      body,
      authenticated: true,
    }),
  retirePrice: (priceId: string) =>
    apiRequest(`admin/prices/${priceId}`, {
      method: "DELETE",
      authenticated: true,
    }),
  syncCatalog: () =>
    apiRequest<{ planKey: string; productId: string; prices: number }[]>(
      "admin/plans/sync",
      { authenticated: true },
    ),
  usage: () => get<TAdminUsage>("admin/usage"),
  auditLogs: (query: TPageQuery, signal?: AbortSignal) =>
    get<TAuditLogPage>(`admin/audit-logs?${queryString(query)}`, signal),
};

export type TAdminTemplate = {
  id: string;
  /** From the template's code. */
  name: string;
  tier: TTemplateTier;
  status: TTemplateStatus;
  category: string | null;
  sortOrder: number;
  /** CVs using it now. */
  cvs: number;
  updatedAt: string;
};

export type TAdminTemplateChange = Partial<
  Pick<TAdminTemplate, "tier" | "status" | "sortOrder">
> & {
  /** Empty clears it. */
  category?: string;
};

export const adminTemplatesApi = {
  list: () =>
    apiRequest<TAdminTemplate[]>("admin/templates", {
      method: "GET",
      authenticated: true,
    }),
  /** Super admins only. */
  update: (id: string, change: TAdminTemplateChange) =>
    apiRequest(`admin/templates/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: change,
      authenticated: true,
    }),
};

export type TAdminEmbed = {
  id: string;
  name: string;
  publicKey: string;
  allowedOrigins: string[];
  disabled: boolean;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    type: "PERSONAL" | "TEAM";
    /** Set for a personal account. */
    owner: { id: string; email: string } | null;
  };
  /** The organization's embedded users, and their CVs. */
  externalUsers: number;
  externalCvs: number;
};

export const adminEmbedsApi = {
  list: () =>
    apiRequest<TAdminEmbed[]>("admin/embeds", {
      method: "GET",
      authenticated: true,
    }),
  /** Sites stop (or start) showing it at once. */
  setDisabled: (id: string, disabled: boolean) =>
    apiRequest(`admin/embeds/${encodeURIComponent(id)}/disabled`, {
      method: "PATCH",
      body: { disabled },
      authenticated: true,
    }),
};
