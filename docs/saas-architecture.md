# CV Builder → SaaS: architecture proposal

Status: **proposal, nothing implemented yet.** Written against the code as of
2026-09-30 (commit `9e894a8` + uncommitted site/pricing work).

---

## 0. What exists today

| Area | Current implementation |
|---|---|
| Monorepo | pnpm + Turbo. `apps/api` (NestJS 12, ESM), `apps/web` (Next 16 App Router, React 19, Emotion, `@costor/ui`), `packages/*` (eslint/tsconfig only). |
| Database | Postgres via Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg`). Models: `User`, `Cv`, `Session`, `AuthToken`, `Country/State/City`. |
| Auth | `auth` module. Access JWT (15 min, `{sub, sid}`) + rotating refresh token (30 d, hashed in `Session`), both httpOnly cookies. `AuthGuard` verifies the JWT **and** checks the session row on every request, so revocation is immediate. Password scrypt, link tokens hashed + single-use. |
| CVs | `cvs` module. `Cv { userId, name, data Json, appearance Json }`. Every query is scoped `where: { id, userId }` → unowned ids return 404. `data`/`appearance` are accepted as arbitrary objects (`@IsObject()`), 10 MB body limit. |
| PDF | `cv-pdf` module. `POST /cv/pdf` takes a whole CV document in the body, launches Puppeteer per request, renders web `/print`. **No auth guard**; web calls it cross-origin at `NEXT_PUBLIC_API_URL`, bypassing the `/api` proxy. |
| Rate limiting | `@nestjs/throttler`, global 100/min, 5/min on sensitive auth routes; in-memory store. |
| Web routing | `(site)` public pages, `/auth/*`, `(dashboard)/dashboard` = "My CVs" grid (TopNav layout), `(editor)/dashboard/create-cv/[step]` and `(editor)/dashboard/edit-cv/[id]/[step]` = the editor (`ManageCvLayout`, icon-rail side nav), `/print` (PDF render target). `proxy.ts` does an optimistic cookie check for `/dashboard/*`. |
| Editor | `CvProvider` (react-hook-form + appearance state) is already UI-shell-agnostic. `ManageCvLayout` couples the shell (logo, ThemeToggle, AuthProvider, `cvsApi`, "Back to my CVs") with the editor itself. A new CV is **only persisted at "Save & Finish"** in `CvExportModal`. |
| Templates | 11 React templates in `apps/web/templates`, referenced by `appearance.templateId`. Code only, no DB entity. |
| Plans | `apps/web/utils/pricing.ts`: Free / Premium, monthly/quarterly/yearly in EUR. Marketing only. |
| Files | Photo is stored as a base64 data URL inside `Cv.data`. No file storage. |
| Tests | Scaffold only (`app.controller.spec.ts`, empty e2e). |

### Gaps to fix regardless of the SaaS work

All six are fixed (Phases 1, 3, 6, 7 and 8).

1. **`POST /cv/pdf` is unauthenticated** and renders any payload in a fresh Chrome. That is both an abuse/DoS vector and the reason a "download" entitlement can't be enforced today.
2. **CV `appearance` isn't validated**, so the backend can't enforce premium templates, colour schemes or fonts.
3. There is **no platform role** or disabled state on `User`.
4. There are **no `frame-ancestors` / `X-Frame-Options` headers**, so every page can be framed (clickjacking). Embedding needs explicit per-customer control anyway.
5. The **in-memory throttler** only works with a single API instance.
6. **Photos are stored as base64 in CV JSON.** Storage usage therefore equals JSON size, and list responses are heavy.

---

## A. Architecture overview

### Core decision: every billable thing belongs to an Organization

A **personal organization** (`type = PERSONAL`) is created for every user, and team organizations (`type = TEAM`) are added later. The subscription, API keys, embed configs, external users, storage config and usage counters all hang off the organization, never off the user directly.

Why this model:
- Pro users get API and embedding without having a "team". Their personal org is the tenant.
- Tenant isolation becomes one rule: *every tenant-scoped row has `organizationId`*.
- Phases 4–7 don't need `userId XOR organizationId` columns on every table.
- The UI never says "organization" to a personal user. They see "My account".

The alternative is putting the owner on each entity (`Subscription.userId?` / `organizationId?`, `ApiKey.userId?` / `organizationId?` …). That is cheaper in Phase 1, but every later phase pays for it twice.

```text
User ──< OrganizationMember >── Organization (PERSONAL | TEAM)
 │                                   │
 │ (personalOwnerId, 1:1)            ├── Subscription ──> Plan ──< PlanPrice
 │                                   ├── ApiKey[]
 └── Cv[] (userId)                   ├── EmbedConfig[]
                                     ├── ExternalUser[] ──> Cv[] (externalUserId)
                                     ├── StorageConfig?  ──> Asset[]
                                     ├── UsageCounter[]
                                     └── Template[] (tenant-private, later)

Every Cv has organizationId (tenant key) and exactly one owner: userId or externalUserId.
```

| Concept | Role |
|---|---|
| **User** | A platform login. Has a platform role (`USER / ADMIN / SUPER_ADMIN`) and one personal org. |
| **Organization** | Tenant and billing owner. |
| **Plan** | Catalog row: features and limits (DB, admin-editable) plus prices. |
| **Subscription** | One per organization. Holds the plan, status, period and provider ids. Free users have a `provider = none` subscription on the default plan, so "no subscription" is never a special case. |
| **Entitlements** | *Computed*: plan + subscription status + overrides → `{ features, limits }`. |
| **Cv** | Owned by a user (platform CV) or an external user (embedded CV). Always tenant-tagged. |
| **ExternalUser** | A customer's end user, identified by `(organizationId, externalId)`. Has no login on our platform. |
| **ApiKey** | Server-to-server credential of an org. Scoped and hashed. |
| **EmbedConfig** | Public embed identity (`publicKey`), allowed origins, theme, branding, allowed templates, sections and features. |
| **StorageConfig / Asset** | Where an org's files live (platform or customer bucket) and what files exist. |

---

## B. Database changes (Prisma)

These are additive. Existing columns keep their meaning.

```prisma
enum PlatformRole        { USER ADMIN SUPER_ADMIN }
enum OrganizationType    { PERSONAL TEAM }
enum OrganizationRole    { OWNER ADMIN MEMBER }
enum SubscriptionStatus  { TRIALING ACTIVE PAST_DUE CANCELED EXPIRED }
enum BillingPeriod       { MONTHLY QUARTERLY YEARLY }

model User {
  // ...existing fields
  role          PlatformRole @default(USER)
  disabledAt    DateTime?
  lastActiveAt  DateTime?                       // throttled write from AuthGuard
  memberships   OrganizationMember[]
  personalOrg   Organization? @relation("PersonalOrg")
}

model Organization {
  id              String           @id @default(uuid())
  type            OrganizationType
  name            String
  slug            String           @unique
  /// Set only for PERSONAL orgs; the unique index enforces one per user.
  personalOwnerId String?          @unique
  personalOwner   User?            @relation("PersonalOrg", fields: [personalOwnerId], references: [id], onDelete: Cascade)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  deletedAt       DateTime?
  members         OrganizationMember[]
  subscription    Subscription?
  cvs             Cv[]
  // later phases: apiKeys, embedConfigs, externalUsers, storageConfig, usage
}

model OrganizationMember {
  organizationId String
  userId         String
  role           OrganizationRole
  createdAt      DateTime @default(now())
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([organizationId, userId])
  @@index([userId])
}

model Plan {
  id          String   @id @default(uuid())
  key         String   @unique            // "free", "premium", "business"; stable, used by code/seed
  name        String
  description String?
  isDefault   Boolean  @default(false)    // plan used when nothing else applies (exactly one; partial unique index)
  isPublic    Boolean  @default(true)     // shown on pricing page
  sortOrder   Int      @default(0)
  /// Feature keys from the code registry (validated on write).
  features    String[]
  /// { "cv.max": 1, "storage.bytes": 52428800, ... }; null value = unlimited.
  limits      Json
  archivedAt  DateTime?
  prices      PlanPrice[]
  subscriptions Subscription[]
}

model PlanPrice {
  id              String        @id @default(uuid())
  planId          String
  period          BillingPeriod
  amountCents     Int
  currency        String        @default("EUR")
  providerPriceId String?       @unique
  active          Boolean       @default(true)   // old prices stay for existing subscribers
  plan            Plan          @relation(fields: [planId], references: [id])
  @@index([planId, active])
}

model Subscription {
  id                     String             @id @default(uuid())
  organizationId         String             @unique
  planId                 String
  priceId                String?
  status                 SubscriptionStatus
  currentPeriodStart     DateTime?
  currentPeriodEnd       DateTime?
  cancelAtPeriodEnd      Boolean            @default(false)
  canceledAt             DateTime?
  trialEndsAt            DateTime?
  provider               String             @default("none")  // "none" | "stripe" | "paddle" ...
  providerCustomerId     String?
  providerSubscriptionId String?            @unique
  /// Admin grants, merged over the plan: { features: [...], limits: {...} }.
  overrides              Json?
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt
  organization           Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  plan                   Plan               @relation(fields: [planId], references: [id])
  @@index([status, currentPeriodEnd])
}

model Cv {
  // ...existing fields
  organizationId  String                // NEW, NOT NULL after backfill
  userId          String?               // becomes nullable in Phase 6
  externalUserId  String?               // Phase 6
  templateId      String?               // denormalized from appearance for admin/filters
  sizeBytes       Int      @default(0)  // for storage usage
  @@index([organizationId, updatedAt])
  @@index([externalUserId, updatedAt])
  // + raw SQL CHECK ((userId IS NULL) <> ("externalUserId" IS NULL)) in Phase 6
}
```

Later phases (same conventions):

```prisma
model Invoice        { id, organizationId, providerInvoiceId @unique, amountCents, currency, status, periodStart, periodEnd, hostedUrl?, createdAt }   // Phase 2
model WebhookEvent   { id, provider, providerEventId, type, receivedAt, processedAt?, error?; @@unique([provider, providerEventId]) }                 // Phase 2 idempotency
model AuditLog       { id, actorType, actorId?, organizationId?, action, resourceType, resourceId?, metadata Json, ip?, createdAt;
                       @@index([organizationId, createdAt]) @@index([actorId, createdAt]) @@index([resourceType, resourceId]) @@index([action, createdAt]) }  // Phase 3, no FKs: logs outlive rows
model OrganizationInvite { id, organizationId, email, role, tokenHash @unique, invitedById, expiresAt, acceptedAt? }                                    // Phase 4
model ApiKey         { id, organizationId, name, prefix, secretHash @unique, scopes String[], environment (LIVE|TEST), createdById, lastUsedAt?, expiresAt?, revokedAt?, createdAt; @@index([organizationId]) } // Phase 5
model UsageCounter   { organizationId, metric, periodStart, count BigInt; @@id([organizationId, metric, periodStart]) }                             // Phase 1 (pdf), Phase 5 (api)
model EmbedConfig    { id, organizationId, name, publicKey @unique, allowedOrigins String[], theme Json, branding Json, templateKeys String[], sections String[], features String[], environment, disabledAt?, createdAt, updatedAt; @@index([organizationId]) } // Phase 6
model ExternalUser   { id, organizationId, externalId, email?, displayName?, createdAt, lastSeenAt?, deletedAt?; @@unique([organizationId, externalId]) }   // Phase 6
model EmbedLaunchToken { id, tokenHash @unique, organizationId, embedConfigId, externalUserId, expiresAt, createdAt }                                   // Phase 6, single-use like AuthToken
model Template       { key @id, name, category, tier (FREE|PREMIUM), status (DRAFT|PUBLISHED|ARCHIVED), version Int, organizationId?, sortOrder, createdAt, updatedAt } // Phase 3
model StorageConfig  { id, organizationId @unique, provider (PLATFORM|S3|AZURE|GCS), settings Json, credentialsEncrypted Bytes?, verifiedAt?, createdAt, updatedAt } // Phase 7
model Asset          { id, organizationId, cvId?, kind (PHOTO|LOGO|PDF), provider, storageKey, contentType, sizeBytes, createdAt; @@index([organizationId]) @@index([cvId]) } // Phase 7
model Session        { /* + */ userAgent?, ipAddress?, lastUsedAt? }   // Phase 1, for the Security page
```

Why these choices:
- **Single `Subscription` row per org, updated in place.** History comes from `Invoice` and `AuditLog`. This avoids "which subscription is current?" queries.
- **`Plan.features` and `limits` live in the DB. The *keys* live in code.** Code enforces keys, so keys can't be invented at runtime. Admins change values, not semantics.
- **`PlanPrice` is separate and never mutated for live subscribers.** Price changes add a new price row.
- **Hashed secrets everywhere** (API keys, launch tokens), matching the existing `hashToken` pattern.

---

## C. Route structure (web)

The editor URLs stay as they are (`/dashboard/create-cv`, `/dashboard/edit-cv/[id]`). They are the "manage one CV" area; renaming them to `/manage-cv` buys nothing.

```text
(site)       /  /pricing  /terms-of-use  /privacy-policy  /cookie-policy  /third-party-tools
/auth/*      unchanged (sign-in, sign-up, forgot/reset, verify, sign-out;
             change-password → redirects to /dashboard/security)

(dashboard)  /dashboard                    Overview                 (was: My CVs grid)
             /dashboard/cvs                My CVs (search, rename, duplicate, delete, download)
             /dashboard/templates          Template gallery (locked badges for premium)
             /dashboard/subscription       Plan, status, renewal, change/cancel, invoices
             /dashboard/usage              Metrics relevant to the plan
             /dashboard/developers         "Connect your application" (API & embedding)
             /dashboard/developers/api-keys
             /dashboard/developers/embeds
             /dashboard/developers/embeds/[id]
             /dashboard/storage
             /dashboard/account            Name, email, delete account
             /dashboard/security           Password, active sessions

(editor)     /dashboard/create-cv/[step]   unchanged
             /dashboard/edit-cv/[id]/[step] unchanged

(org)        /org/[slug]                   Team org overview           (Phase 4)
             /org/[slug]/members | subscription | usage | developers/... | external-users | storage | settings

(admin)      /admin  /admin/users  /admin/users/[id]  /admin/organizations  /admin/organizations/[id]
             /admin/subscriptions  /admin/plans  /admin/plans/[id]  /admin/cvs
             /admin/templates  /admin/templates/[key]  /admin/developers  /admin/storage
             /admin/usage  /admin/audit-logs  /admin/settings

(embed)      /embed/[publicKey]                        external user's CV list (or straight to editor)
             /embed/[publicKey]/cv/new/[step]
             /embed/[publicKey]/cv/[id]/[step]
public/      /embed/v1/cv-builder.js                   loader script (versioned path)

/print       unchanged (internal PDF target)
```

Notes:
- **`/dashboard` becomes Overview.** Old `/dashboard?search=…&page=…` links redirect to `/dashboard/cvs?…`. The "My CVs" links need updating in `DEFAULT_SIGNED_IN_PATH`, `AccountNav`, `AppNavigation`, `ManageCvLayout` ("Back to my CVs"), `CvExportModal` (`router.push("/dashboard")`) and `dashboardPath()`.
- **The developer, subscription, usage and storage *views* take an `organizationId`.** `/dashboard/developers` renders the personal org and `/org/[slug]/developers` renders a team org with the same component.
- **`DashboardLayout` gets a side nav** following `ManageCvLayout`'s rail pattern (icon `IconButton`s + tooltips inside a card) with `TopNav` kept on top. `AdminLayout` is the same shell with a different item list. Nav items come from config arrays; entitlement-gated items still show, with a lock badge that links to upgrade.
- **`proxy.ts` matcher** adds `/admin/:path*` and `/org/:path*` to the signed-in-only list. This is still only an optimistic check: the API decides.
- **`/embed/*`** has its own root-level shell with no `TopNav`, `AuthProvider` or site chrome. `next.config.js` `headers()` gives every non-embed route `frame-ancestors 'self'`. `/embed/*` gets a per-config `frame-ancestors` list (see G).

---

## D. Backend modules (NestJS)

```text
src/
  auth/            existing. AuthGuard also loads user.role + disabledAt (same query as sessionExists)
  authz/           NEW  principal types, @CurrentPrincipal(), PlatformRolesGuard + @PlatformRoles(),
                        OrgAccessGuard + @OrgRole(), ScopesGuard + @Scopes()
  organizations/   NEW  OrganizationsService (personal org on sign-up, CRUD, members, invites)
  plans/           NEW  PlansService; GET /plans (public, drives the pricing page)
  entitlements/    NEW  feature/limit registry, EntitlementService, @RequiresFeature() guard, error types
  subscriptions/   NEW  SubscriptionService (state machine: change plan, cancel, resume, expire)
  billing/         NEW  BillingService, PaymentProvider interface, NoopPaymentProvider,
                        <Provider>PaymentProvider (Phase 2), POST /billing/webhooks/:provider
  usage/           NEW  UsageService (stock metrics computed, flow metrics from UsageCounter)
  account/         NEW  GET/PATCH/DELETE /account, GET /account/overview, sessions list/revoke
  cvs/             existing. Owner-scoped via TCvOwner; limit + template checks; duplicate
  cv-pdf/          existing. Auth + ownership + entitlement; browser reuse; concurrency cap
  templates/       NEW  catalog + availability per entitlements/tenant; admin CRUD (Phase 3)
  audit/           NEW  AuditService.record() called from services; metadata denylist
  admin/           NEW  controllers under /admin/*, all @PlatformRoles('ADMIN')
  api-keys/        NEW  (Phase 5) ApiKeysService, ApiKeyGuard
  public-api/      NEW  (Phase 5) /v1/* thin controllers over the same services
  embed/           NEW  (Phase 6) EmbedConfigsService, EmbedSessionsService, EmbedAuthGuard, /embed/v1/*
  external-users/  NEW  (Phase 6)
  storage/         NEW  (Phase 7) StorageProvider interface, providers, StorageResolver, AssetsService
  rate-limit/      NEW  named throttlers + plan-aware limits, Redis storage for multi-instance
  locations/ mail/ prisma/   existing
```

**Shared package `packages/cv-core` (new).** Today the CV document types (`TCvData`, `TCvAppearance`) and the template catalog only exist in `apps/web`. The backend needs them to validate `appearance` (premium template/scheme/font checks) and later to serve the public API. The package holds:
- CV document types and a runtime validator,
- the template *catalog metadata* (keys, colour scheme ids, font ids, which ones are free),
- the entitlement feature/limit key lists.

The React renderers stay in `apps/web/templates`.

---

## E. Authorization model

The three layers are kept separate, and every request goes through them in this order:

```text
1. Authentication  → a Principal         (AuthGuard | ApiKeyGuard | EmbedAuthGuard)
2. Authorization   → may this principal touch this resource?   (guards + owner-scoped queries)
3. Entitlement     → does the tenant's plan allow it?          (EntitlementService)
```

```ts
type TPrincipal =
  | { kind: 'user';     userId; sessionId; role: PlatformRole }
  | { kind: 'apiKey';   apiKeyId; organizationId; scopes: ApiScope[] }
  | { kind: 'external'; externalUserId; organizationId; embedConfigId };
```

| Actor | Rule |
|---|---|
| **User → own CVs** | Services take a `TCvOwner` (`{ userId }` or `{ organizationId, externalUserId }`) and build every `where` from it. They never do `findUnique({ where: { id } })` on tenant data. This is the pattern `CvsService` already uses. Unowned resources return 404, not 403. |
| **Platform admin** | `User.role` is read from the DB by `AuthGuard` on each request, never from the JWT or the client. `@PlatformRoles('ADMIN')` protects `/admin/*`. `SUPER_ADMIN` is required for plan edits, role changes and settings. Admin endpoints return projections that never include `passwordHash`, token hashes, API key hashes or storage credentials. |
| **Organization member** | `OrgAccessGuard` resolves `:orgId` / `:slug` to a membership. `OWNER` can do anything including billing, delete and ownership transfer. `ADMIN` manages keys, embeds, members (except owners) and storage. `MEMBER` has read-only access to settings and usage. Platform roles and org roles are independent. |
| **API key** | Hash lookup, `revokedAt IS NULL` and expiry are checked **on every request**, with no cache, so revocation is immediate. Scopes are checked by `@Scopes()`. The principal is pinned to one org, and all queries add `organizationId`. |
| **Embedded external user** | The embed token pins `(organizationId, externalUserId, embedConfigId)`. The user can only reach CVs where `organizationId = token.org AND externalUserId = token.xu`, plus the templates, sections and features allowed by the effective embed config. |

**API scopes:** `cv:read`, `cv:create`, `cv:update`, `cv:delete`, `cv:export`, `template:read`, `external-user:read`, `external-user:write`, `embed:session` (mint launch tokens), `storage:read`, `usage:read`. The UI offers presets such as "Embed only (`embed:session`)" and "Full access".

**Rules that apply everywhere:** never trust client-provided user ids, organization ids, plan, role or permissions. The org always comes from the principal, or from a route param that the guard checked against membership.

---

## F. Entitlement model

**Registry (code, `packages/cv-core/entitlements.ts`):**

```ts
export const FEATURES = [
  'cv.download.pdf', 'template.premium', 'appearance.allColorSchemes', 'appearance.allFonts',
  'appearance.resizeSections', 'cv.multiPage',
  'api.access', 'embed.builder', 'embed.whitelabel', 'storage.external', 'organization.team',
] as const;

export const LIMITS = [
  'cv.max', 'storage.bytes', 'pdf.monthly', 'apiKey.max', 'api.requests.monthly',
  'embed.max', 'embed.externalUsers.max', 'org.members.max',
] as const;   // value null = unlimited
```

The first six features map to what the pricing page already promises ("3 starter templates", "default colour scheme and fonts", "resizable sections", "multi-page").

**Resolution:**

```text
EntitlementService.forOrganization(orgId)  (per-request memo)
  subscription = org.subscription
  plan = isEffective(subscription) ? subscription.plan : defaultPlan
         isEffective = ACTIVE | TRIALING | PAST_DUE (grace period) | CANCELED with currentPeriodEnd > now
  → Entitlements { planKey, status, features: Set, limits, can(f), limit(l) }
     with subscription.overrides merged on top
```

**Checks:**

```ts
const ent = await entitlements.forOrganization(orgId);   // or forUser(userId)
ent.can('embed.builder');                         // boolean
ent.limit('cv.max');                              // number | null (null = unlimited)
ent.allowsAnother('cv.max', usedCount);           // boolean
ent.assertCan('api.access');                      // throws PlanFeatureRequiredException
ent.assertAllowsAnother('cv.max', usedCount);     // throws PlanLimitReachedException
@RequiresFeature('embed.builder')                 // route-level guard
```

Errors are `403` with a stable body:

```json
{ "code": "PLAN_LIMIT_REACHED", "limit": "cv.max", "used": 3, "max": 3, "message": "…" }
```

The frontend maps `code` to a single "Upgrade your plan" component, which avoids one-off copy for each case.

**Frontend:** `GET /account/entitlements` returns the same object plus current usage. A `useEntitlements()` hook drives display only: "2 / 5 CVs used", lock badges and upgrade CTAs. Nothing is hidden silently; locked items show the reason.

**CV creation (race-safe):**

```text
POST /cvs
  tx: SELECT id FROM "Subscription" WHERE "organizationId" = $1 FOR UPDATE   -- serializes creates per tenant
      count = COUNT(cvs WHERE owner)
      assertWithinLimit('cv.max', count)
      validate appearance against allowed templates/schemes/fonts
      INSERT cv
  usage/audit after commit
```

Duplicate goes through the same path.

**Create flow UX.** A new CV is only saved at "Save & Finish", so a user at their limit could fill in a whole CV and then be refused. The fix has three parts:
1. The `create-cv` layout checks entitlements on entry and shows the limit screen, with upgrade and "manage my CVs" actions, instead of the editor.
2. The backend still enforces the limit.
3. `CvExportModal` handles `PLAN_LIMIT_REACHED` with the same upgrade component.

**Downgrade and expiry policy (recommended):**
- Nothing is ever deleted.
- The account shows `10 / 3 CVs` and creating or duplicating is blocked until the count is under the limit.
- **Existing CVs stay viewable, editable and downloadable.** Locking a user out of their own CV feels punitive and causes support load.
- **Premium appearance is grandfathered.** A CV already on a premium template keeps rendering. The backend only validates appearance fields that *change* on update, so users can't switch *into* a premium template, scheme or font.
- When a subscription expires or is canceled past its period, entitlements fall to the default plan through `isEffective`. This is computed, not a batch job, so there's no data migration and resubscribing restores everything instantly.

---

## G. Embedding architecture

**Public contract:** the loader script. Customers include `/embed/v1/cv-builder.js`, which today mounts an iframe pointing at `/embed/[publicKey]`. A plain `<iframe>` is also documented. Because the loader is the contract, a later Shadow-DOM direct mount can replace the iframe without customer changes. That is how "don't commit to one technology" is handled.

**Identity flow (server-to-server, no secrets in the browser):**

```text
Customer backend ──POST /v1/embed/sessions──────────────────────────────► Our API
  Authorization: Bearer cvb_live_…   (API key, scope embed:session)
  { publicKey, externalUserId, email?, name? }
                                        upsert ExternalUser(org, externalId)
                                        check embed.builder + embed.externalUsers.max
◄── { launchToken, expiresAt }  (random, hashed in EmbedLaunchToken, single use, 60 s TTL)

Customer frontend
  CvBuilder.mount('#cv', { publicKey, launchToken, onEvent })
     loader creates <iframe src="https://our-app/embed/{publicKey}">
     and postMessages { launchToken } to targetOrigin = our origin only
  (plain iframe option: src="…/embed/{publicKey}#launch={token}"; the fragment is never sent to servers or in Referer)

Embed iframe (our origin)
  accepts postMessage only from event.origin ∈ config.allowedOrigins
  POST /api/embed/v1/sessions/exchange { publicKey, launchToken }
                                        consume token (deleteMany + count, like AuthToken)
                                        config enabled? org entitled? external user active?
◄── { embedToken }  JWT { typ:'embed', aud:'embed', org, xu, cfg }, 60 min, separate secret EMBED_JWT_SECRET

  All embed calls: Authorization: Bearer <embedToken>  (held in memory, no cookies)
  On expiry: iframe → parent postMessage 'cvbuilder:session-expired' → customer mints a new launch token
```

Why these choices:
- **Bearer tokens instead of cookies.** Third-party cookies inside iframes are blocked by Safari and increasingly by Chrome. It also keeps embed sessions from ever mixing with platform-user cookies.
- **Separate JWT secret and `typ`/`aud`.** An embed token can never pass `AuthGuard`, and a user token can never pass `EmbedAuthGuard`.
- **Allowed domains are enforced where the browser actually enforces them:**
  1. The `/embed/*` response header `Content-Security-Policy: frame-ancestors <allowedOrigins>` is resolved per `publicKey` in `proxy.ts`/route handler through a cached config lookup.
  2. `postMessage` origin checks run in both directions.
  3. The exchange endpoint checks `Origin` as defense in depth.
  
  Origin and Referer are never the authorization. The API key and the launch token are.
- **`externalUserId` is trusted only because it arrived with the customer's secret key.** `ExternalUser` is unique per `(organizationId, externalId)`, so the same id in two tenants is two unrelated rows.
- **Phase 6b option:** customer-signed JWT (HS256 with a per-embed signing secret) for customers who want to skip the round trip.

**Effective embed config (centralized, no scattered conditionals):**

```ts
resolveEmbedConfig(config, entitlements) → {
  theme,                                              // colors, font, radius, background, logo
  branding: { ...config.branding,
              showPlatformBranding: !ent.can('embed.whitelabel') || config.branding.showPlatformBranding },
  templates: config.templateKeys ∩ availableTemplates(ent),
  sections:  config.sections ∩ CV_EDITOR_STEPS,
  features:  config.features ∩ entitledFeatures(ent),   // e.g. pdf download
}
```

The embed shell renders only from this object. The API applies the same resolved config on every write, so the iframe UI is not the enforcement point.

**Shared editor core** (refactor of `ManageCvLayout`, no duplication):

```text
CvEditor (new, in components/cv-editor)
  props: steps, basePath, brand slot, templates, features, adapter { load, save, downloadPdf }
  contains: rail nav, step header, step content, completion, back/continue, preview, export modal
├── ManageCvLayout = AuthProvider + cookie adapter (cvsApi) + our logo/ThemeToggle
└── EmbedLayout    = embed session provider + bearer adapter + tenant theme/branding
```

`CvProvider`, the step views and `CvDisplay` are reused as they are. `TemplatesPage` reads the allowed list from context instead of importing `templates` directly. `api-client.ts` gains a transport option (base path, auth header, 401 handler) so the same `cvsApi` works in both shells.

---

## H. Storage architecture

**Today** everything is in Postgres: CV JSON, including the photo as base64.

```ts
interface StorageProvider {
  put(key: string, body: Buffer | Readable, opts: { contentType: string }): Promise<{ sizeBytes: number }>;
  get(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  signedUrl?(key: string, ttlSeconds: number): Promise<string>;
  verify(): Promise<void>;   // test write/read/delete when a customer connects storage
}
// PlatformStorageProvider (our S3-compatible bucket; local disk in dev), S3StorageProvider,
// AzureBlobStorageProvider, GcsStorageProvider — added as customers need them.
StorageResolver.forOrganization(orgId): StorageProvider   // PLATFORM unless storage.external + verified config
```

- **What goes to storage:** photos, logos and generated PDFs (`Asset` rows). **CV structured data stays in our DB** in both modes, because the editor, search, list and rendering need it. A full data-residency mode (CV JSON in the customer's bucket) is possible through the same interface but costs search and listing. Treat it as a separate product decision.
- **Keys are always tenant-prefixed:** `org/{orgId}/cv/{cvId}/{assetId}`. Asset access goes through our API, which checks ownership, then streams or redirects to a short-lived signed URL.
- **Customer credentials** are encrypted at rest (AES-256-GCM, key from env/KMS), write-only in the API (never returned), and masked in the UI. Prefer delegated access (AWS AssumeRole with an external id, Azure SAS, GCS workload identity) over static keys.
- **Accounting:** `storage.bytes` counts `Cv.sizeBytes + Σ Asset.sizeBytes` on platform storage. External storage doesn't count against the platform quota.
- **Migration:** photos move out of JSON lazily. When a CV with a data-URL photo is saved, the photo is uploaded as an `Asset` and replaced by an asset reference. Rendering (including `/print`) accepts both forms during the transition.

---

## I. Migration strategy

Guiding rule: **additive schema, backend before frontend, existing endpoints keep their shapes.**

1. **One Prisma migration** (hand-edited SQL, run in order):
   1. Create enums, `Plan`, `PlanPrice`, `Organization`, `OrganizationMember` and `Subscription`. Add `User.role`, `User.disabledAt`, `User.lastActiveAt` and `Session` device columns.
   2. `INSERT` the initial plans (`free` is `isDefault`, then `premium`) with fixed keys. The backfill below depends on them, so this lives in the migration, not the seed.
   3. Backfill each existing user: insert a personal `Organization`, an `OrganizationMember(OWNER)` and a `Subscription(plan = free, status = ACTIVE, provider = 'none')`.
   4. Add `Cv.organizationId` as nullable, run `UPDATE … FROM Organization WHERE personalOwnerId = Cv.userId`, then set it `NOT NULL` and add the index. Compute `sizeBytes` and `templateId` from existing JSON.
2. **`AuthService.signUp`** creates the user, personal org, membership and free subscription in one transaction.
3. **Existing heavy users** (more CVs than Free allows) become "over limit", nothing breaks, and they can't create more. If that's too harsh for early users, grant them `Subscription.overrides` in the same migration.
4. **API compatibility:** `/cvs` request and response shapes are unchanged. The only new behaviour is `403 PLAN_LIMIT_REACHED` / `PLAN_FEATURE_REQUIRED`, and the frontend handles it before the backend starts enforcing (see phase order below).
5. **PDF endpoint change** is done as add-then-remove. Add `POST /cvs/:id/pdf` (saved CV: auth + ownership + entitlement + usage) and require auth on `POST /cv/pdf` (unsaved draft preview, stricter throttle). Switch the web client to them through the `/api` proxy, then remove the anonymous path.
6. **Pricing page** switches from `utils/pricing.ts` to `GET /plans`. The marketing copy (taglines, feature bullet text) can stay in the web app, keyed by `plan.key`.
7. **Tests:** e2e (supertest) for each authorization rule as it lands:
   - user A cannot read, update, delete or PDF user B's CV,
   - limit enforcement, including two concurrent creates,
   - admin routes reject non-admins,
   - revoked keys fail immediately,
   - an embed token from tenant A can't reach tenant B.

---

## J. Implementation phases

Each task is small enough to review and test on its own, and the app keeps working after every one.

### Phase 1: Foundation
1. ✅ **Harden PDF:** require `AuthGuard` on `/cv/pdf`, add `POST /cvs/:id/pdf`, route the web through `/api`, add a stricter throttle for PDFs, reuse one browser and cap concurrency.
2. ✅ **`packages/cv-core`:** move CV document types and template catalog metadata in. Web imports from it and behaviour is unchanged.
3. ✅ **Schema migration and backfill** (section I.1), plus signing up with a personal org. (`Cv.templateId`/`sizeBytes` moved to task 6 and the `Session` device columns to task 10, so each column lands with the code that keeps it up to date.)
4. ✅ **`authz` module:** `AuthGuard` loads role and `disabledAt`, plus `PlatformRoleGuard` (`@RequirePlatformRole()`). There are no admin routes yet; the role guard is unit-tested only.
5. ✅ **`plans` + `entitlements`:** registry, `EntitlementService`, error types, `GET /plans`, `GET /account/entitlements`.
6. ✅ **`cvs`:** (free templates: `default`, `classic`, `minimal`; `FREE_TEMPLATE_IDS` in `cv-core` until Phase 3 moved them to the `Template` table) enforce `cv.max` with the locking transaction, validate changed appearance fields, add `POST /cvs/:id/duplicate`, and add `Cv.templateId` + `Cv.sizeBytes` (with a backfill).
7. ✅ **`usage`:** `UsageCounter` for `pdf.generated` (also enforces `pdf.monthly`; a failed render isn't counted), and `GET /account/overview` with plan, subscription and usage.
8. ✅ **Web:** `EntitlementsProvider` / `useEntitlements()`, `<UpgradePrompt>`, `<PremiumBadge>`, `<LockedFeaturesNotice>` (via `useLockedFeatures()`, the same rule as the API), limit-gated create entry, and export modal blocking + plan error handling. Premium options stay selectable for previewing.
9. ✅ **Web:** `DashboardLayout` side nav (reusable `SideNav`), Overview at `/dashboard`, My CVs moved to `/dashboard/cvs` (rename, duplicate, delete, download; shared `CvCard`), and old `/dashboard?search=` links redirected.
10. ✅ **Web:** Templates gallery page (starts a CV via `?template=`), Usage page, Account page (profile, email verification, delete account), Security page (password moved in, sessions list/revoke; adds `Session.userAgent`/`ipAddress`/`lastUsedAt`), and read-only Subscription page (plan, status, plans from `GET /plans`). API: `PATCH/DELETE /account`, `GET /account/sessions`, `DELETE /account/sessions/:id`, `POST /account/sessions/sign-out-others`.
11. ✅ **Web:** pricing and home pages read `GET /plans` on the server (`utils/public-plans.ts`, cached 5 minutes, shows a notice if the API is unreachable). Prices, limits and features come from the database; `utils/pricing.ts` only keeps marketing (highlighted plan, extra selling points) keyed by plan.

**Phase 1 complete.**

### Phase 2: Billing

**Decisions (2026-09-30).** The company is based in Serbia, and prices should show in the visitor's currency.
- **Provider: Paddle Billing** (merchant of record).
  - Stripe doesn't onboard companies registered in Serbia; it would take a US company.
  - Paddle doesn't list Serbia among the countries it can't serve. It calculates, collects and remits VAT and sales tax worldwide, and handles invoices and refunds. Seller eligibility still has to be confirmed at Paddle signup.
  - Paddle charges in 33 currencies. **RSD isn't one of them**, so Serbian customers are charged in EUR. Payouts are in USD, EUR, GBP, AUD or CAD.
- **Recurring subscriptions** that renew automatically and can be canceled anytime, effective at the end of the period. This is the standard SaaS model the subscription states are built for. The pricing FAQ, which currently says "one-off payment, doesn't renew", must be updated to match.
- **Prices per currency live in our DB**: `PlanPrice` has one row per plan, period and currency. The database stays the source of truth for display, and each row maps to a Paddle price (`providerPriceId`). The display currency comes from the visitor's country, using a `Country.currency` column filled from GeoNames. If a plan has no price in that currency, it falls back to the default currency (EUR). Visitors can also pick a currency themselves.
- **Country detection:** a configurable geo header from the hosting platform or CDN (e.g. `cf-ipcountry`, `x-vercel-ip-country`), then the region in `Accept-Language`, then the default. The checkout's billing address stays the authority for what's actually charged, and Paddle applies tax by the customer's location.
- **The abstraction stays multi-provider.** The payment provider is chosen per currency and country, so a local Serbian acquirer charging RSD (with domestic cards) can be added later next to Paddle without changing plans, subscriptions or entitlements.

0. ✅ **Multi-currency prices (provider-independent):** (each plan is shown in a single currency: the chosen one if it has any price in it, else EUR, so periods never mix currencies) `Country.currency`; `PlanPrice` unique per (plan, period, currency) among active prices; `GET /plans?currency=` / `?country=`, with fallback; country detection in the web app; a currency picker on the pricing and subscription pages.
1. ✅ `PaymentProvider` interface (`src/billing/billing.types.ts`); with no provider configured, billing answers "payments aren't set up yet". `BillingService` applies provider subscriptions to our rows (unit-tested: own-organization checkouts only, no double subscriptions, webhook idempotency and retry).
   - **Built (tasks 1–4):**
     - `PaddleProvider` handles the catalog sync (`pnpm billing:sync-catalog`), customers, server-created checkouts (`custom_data.organizationId`), plan and period changes (prorated), cancel at period end, resume, the customer portal, and webhook signature checks (HMAC-SHA256 with a 5-second tolerance).
     - The Subscription page does upgrade (Paddle.js overlay), switch, cancel, resume, and "Invoices & payment method" (the portal).
     - `POST /billing/checkout/:id/complete` syncs right after payment, so no webhook is needed in development.
     - Provider failures are answered as a 503 "payments are unavailable".
   - **Paddle setup:**
     - `PADDLE_API_KEY` (sandbox keys start with `pdl_sdbx_`).
     - `PADDLE_CLIENT_TOKEN`, which the sync script prints.
     - In the dashboard, **Checkout → Checkout settings → Default payment link**. It's required before any transaction can be created.
     - Optionally, **Business account → Currencies → automatic currency conversion**.
     - For production, a notification destination pointing at `POST /billing/webhooks/paddle`, with its secret in `PADDLE_WEBHOOK_SECRET`.
   - **Verified end to end in the sandbox (2026-09-30):** paid €9.99 with the test card, the plan switched on, then switched to yearly (prorated), canceled, resumed, and the portal link opened. Prices are limited to quantity 1.
2. Concrete provider: checkout session (upgrade), provider portal or in-app change and cancel, proration policy.
3. `POST /billing/webhooks/:provider`: raw body, signature check, `WebhookEvent` idempotency, sync into `Subscription` and `Invoice`.
4. Subscription page actions: upgrade, downgrade (effective at period end), cancel, resume, invoices.
5. ✅ A scheduled reconciliation job that re-reads provider state for drifted subscriptions: `BillingReconciler` runs every `BILLING_RECONCILE_HOURS` (default 12, 0 = off), and `pnpm billing:reconcile` runs it by hand. It also finds paid subscriptions that never reached us, per customer, for their own organization only.
6. ✅ **Approximate RSD for visitors from Serbia:** the National Bank of Serbia middle rate (via kurs.resenje.org, configurable as `NBS_RATES_URL`), cached for 12 hours, with the last known rate kept if the source fails. Shown as "≈ 783 RSD / month" with a note that the charge is in EUR.
7. ✅ The Subscription page opens Paddle's `?_ptxn=` checkouts (the default payment link) and cleans up the URL.

**Before going live:**
- Approve your domain in Paddle (**Checkout → Website approval**).
- Set the live default payment link to `https://<domain>/dashboard/subscription`.
- Add a notification destination for `https://<api>/billing/webhooks/paddle` and put its secret in `PADDLE_WEBHOOK_SECRET`.
- Use the live API key and client token, then run `pnpm billing:sync-catalog` against live.

### Phase 3: Admin
1. ✅ `AuditService` and recording the existing actions: sign-up and sign-in, passwords, profile, sessions, account deletion, CVs, checkouts, subscription changes (only when plan, price, status or cancellation changed, with USER or SYSTEM actor) and admin actions. IP and User-Agent come from a per-request context; secret-looking keys are redacted; a failed write never breaks the action.
2. ✅ `AdminLayout`, `/admin` guard in `proxy.ts`, API `@RequirePlatformRole(ADMIN)`. The first super admin is made with `pnpm admin:grant <email> SUPER_ADMIN`.
3. ✅ Admin overview stats (users, CVs, paid subscriptions, estimated MRR per currency, PDFs, storage), then Users (search, filter, detail with usage and activity, disable/enable; disabling revokes sessions). Only super admins change roles or act on other admins; nobody acts on their own account.
4. ✅ Admin Subscriptions (status, plan and paying filters), Plans (name, visibility, archive, features and limits validated against the registry; prices added as new rows that retire the old one; "Sync to Paddle"), and per-account extra allowances (overrides) on the user page. Changes to plans and extras are SUPER_ADMIN only; the free default plan can't get prices or be archived.
5. ✅ `Template` table (`id` matching the code template, `tier` FREE/PREMIUM, `status` PUBLISHED/HIDDEN, `category`, `sortOrder`), seeded with the 11 templates as they were offered. Looks stay in code; a template added in code gets a hidden premium row at API startup. `GET /templates` lists published ones (cached 30s in the API); `GET /plans` adds `freeTemplateCount`. Saves reject switching to a hidden template (CVs already on one keep it), and `premiumFeaturesNeeded` takes the free list from the table instead of `FREE_TEMPLATE_IDS`. Admin Templates (preview, category, tier, status, order, CVs using each; SUPER_ADMIN edits; the `default` template stays published and free). Still to do: template versioning (a renderer change that alters layout ships as a new version key, and CVs pin their version).
6. ✅ Admin Usage (sign-ups, CVs and PDFs by month; accounts with the most CVs and storage) and the Audit log viewer (filter by action; people shown by email while their account exists).

### Phase 4: Organizations
Decisions: a team is its own customer, with its own subscription starting on the default plan; anyone can create one (up to 10 owned). Inviting needs the *team's* plan to include `organization.team`, and `org.members.max` counts members besides the owner plus pending invites. CVs stay personal; team CVs aren't in this phase. The UI says "team", never "organization". One owner per team: OWNER handles billing and deletion, ADMIN manages members (not the owner) and the name, MEMBER can look.

1. ✅ Teams (`POST/GET /teams`, `GET/PATCH/DELETE /teams/:teamId`), `TeamAccessGuard` + `@RequireTeamRole()` (404 for non-members, 403 for too low a role), `TeamsProvider` and a workspace switcher at the top of the side nav. Web: `/dashboard/teams` (list, create) and `/teams/[slug]` (members), `/subscription`, `/settings`.
2. ✅ Members: invite by email (`OrganizationInvite`, token hashed, 7 days, re-inviting replaces; only the invited email can accept; seat limit checked on invite and again on accept), change role, remove, leave, transfer ownership (the old owner becomes an admin). `/invite/[token]` works signed out. Audit actions `TEAM_*`, `MEMBER_*`, `INVITE_*`, `OWNERSHIP_TRANSFERRED`.
3. ✅ Team subscription: the Subscription page and billing endpoints take a `teamId`; only the owner pays or changes the plan, others see it read-only. The Members page shows seats used. Deleting a team, or an account, is refused while a paid plan still renews; an account can't be deleted while it owns a team with other members (teams it owns alone go with it).

### Phase 5: API
1. ✅ `ApiKey` (per organization, `cvb_live_<8 hex>_<secret>`, only a SHA-256 of the whole key stored, shown once, optional expiry, revoke). Making one needs `api.access` and room under `apiKey.max`. UI: Developers in the dashboard, API keys in a team (owners and admins). Audit `API_KEY_CREATED`/`REVOKED`; CVs made or deleted through the API are logged with actor `API_KEY`.
2. ✅ `ApiKeyGuard` + `@RequireApiScopes()` (the scopes guard is the same guard): key looked up on every request (revoking and downgrades act at once), `api.access` checked each time. `/v1/cvs` (list, get, create, update, delete, PDF) over the same `CvsService`, so `cv.max`, template and appearance rules and `pdf.monthly` apply; `/v1/templates` (with `available` per the key's plan); `/v1/usage`. Scopes: `cv:read|create|update|delete|export`, `template:read`, `usage:read`. Team keys get 409 on `/v1/cvs` until embedded users (Phase 6) give teams CVs.
3. ✅ 120 requests a minute per key (in-process; **needs Redis before running more than one API instance**), `/v1` exempt from the per-IP limit, and `api.requests.monthly` counted in `UsageCounter` (`api.request`) with a 429 `PLAN_LIMIT_REACHED` once used up. No plan includes API access yet: add it to a plan (or as extras) to sell it.
4. ✅ API reference from the controllers (`@nestjs/swagger`): only `/v1` routes, at `/v1/docs` (Swagger UI) and `/v1/openapi.json`, with each route’s scope, bearer auth and the shared 401/403/429 errors added by `@RequireApiScopes()`. Linked from the Developers page. `@scarf/scarf` (Swagger UI’s install telemetry) is set to not run in `pnpm-workspace.yaml`.

### Phase 6: Embedding
1. ✅ `EmbedConfig` (public key `pk_<24 hex>`, allowed origins: https only, localhost for testing; brand color, light/dark, radius; company name, logo, "Made with CV Builder"; templates; steps; PDF downloads; on/off). Needs `embed.builder` and room under `embed.max`. UI: Embeds in the dashboard and in a team (owners and admins), with copy-ready page and server snippets.
2. ✅ No separate `CvEditor` component was needed: an editor-environment context (`CvEditorEnvProvider`) lets the embed set its paths, steps, branding, save/PDF transport, after-save action, template list and "no upgrade prompts"; with no provider the app behaves exactly as before. The embed has its own bearer-token client (`utils/embed-api.ts`), not the cookie one.
3. ✅ `Cv` owned by exactly one of `userId` or `externalUserId` (check constraint `Cv_one_owner`); `CvsService` takes an owner (a user id, or `{ organizationId, externalUserId, templateIds }`), so limits, plan checks, PDF counting and audit (`EXTERNAL_USER`) follow it; `cv.max` is per embedded user. `ExternalUser` (unique per organization and external id, within `embed.externalUsers.max`), `POST /v1/embed/sessions` (scope `embed:session`), `EmbedLaunchToken` (hashed, one minute, used once by deleting it), `POST /embed/v1/sessions/exchange` (checks the parent page against allowed origins when known), embed JWT (`EMBED_JWT_SECRET`, audience and type `embed`, 60 minutes), `EmbedAuthGuard` (re-checks embed on and plan on every request), `/embed/v1/cvs` and PDFs.
4. ✅ `/embed/[publicKey]` shell (no account or site chrome; brand theme; credit link), `frame-ancestors` per embed from `proxy.ts` (cached a minute) and `frame-ancestors 'self'` + `X-Frame-Options` everywhere else (`next.config.js`), loader `/embed/v1/cv-builder.js` (`CvBuilder.mount`, `relaunch`, `destroy`), `postMessage` protocol (`waiting` → `launch` to our origin only; `ready`, `saved`, `session-expired` to the allowed parent only), or `#launch=<token>` in the frame address.
5. ✅ `resolveEmbedConfig`: templates limited to published ones the plan includes (an end user can't upgrade), steps in editor order, downloads only with `cv.download.pdf`, our credit unless `embed.whitelabel`. The API enforces the same object on every embed request.

Follow-ups, done: API keys work with embedded users' CVs through `?externalUserId=` on `/v1/cvs` (required for team keys; unknown users are a 404, so the user limit holds); Admin → Embeds lists every account's embeds with their embedded users and CVs, and an admin can turn one off (audited); the Embeds page previews an embed in a dialog as a reserved `cvb-preview` user that doesn't count toward the plan (customers can't use that id).

### Phase 7: Storage
1. ✅ `StorageProvider`; our own storage is the local disk (`STORAGE_DIR`, default `apps/api/storage`, git-ignored) or, with `PLATFORM_STORAGE=s3` and `PLATFORM_S3_*`, an S3-compatible bucket shared by every instance (needed with more than one). `Asset` (keys `org/{orgId}/assets/{id}`), `POST /assets/photos` and `POST /embed/v1/assets/photos` (JPEG/PNG/WebP checked by their bytes, 5 MB), `GET /assets/:id` (public to whoever has the link: the random id is the access, since images, embeds and the PDF renderer can't send credentials; immutable cache). The editor shows a picked photo at once and swaps in the stored link once uploaded (falls back to inline if the upload fails). Data-URL photos are moved out on save. A file belongs to the CV saved with it (only its uploader's CVs; another CV's file is copied, e.g. on duplicate), files a CV stops using or deleted CVs' files are removed, unattached uploads are cleared after a day, and an organization's files go when it's deleted. `/print` waits for images before printing.
2. ✅ `storage.bytes` = CV data + platform files, enforced on upload; the Usage page shows it (the "Saved CVs" count now leaves out embedded users' CVs). The Storage page moves to part 3, where its job is connecting an organization's own bucket.
3. ✅ `StorageConfig` (one per organization, `storage.external`; settings bucket/region/endpoint/folder; access key and secret encrypted with AES-256-GCM under `STORAGE_ENCRYPTION_KEY`, never returned, only the key's last 4 shown). `S3StorageProvider` without an SDK: Signature V4 checked against AWS's published examples, path-style for custom endpoints (R2, MinIO, Spaces), paged prefix deletes. Verify = write, read back, delete a test file; only a verified config (on a plan that allows it) takes new uploads, files are read from where they were put, and bucket files don't count toward `storage.bytes`. Endpoints on localhost or private networks are refused outside development (SSRF); DNS that resolves to a private address isn't caught yet (Phase 8). Storage page in the dashboard and in teams (owners and admins). Disconnecting keeps the bucket's files but they can no longer be shown; deleting an organization doesn't delete files in its own bucket. Tested end to end against a fake S3; **not yet against a real bucket**.

### Phase 8: Hardening
- ✅ Authorization and tenant isolation: every id-only lookup reviewed (each is an admin action, the user's own record, the public file link, or follows an ownership check). `test/tenant-isolation.e2e-spec.ts` runs the real app and database and tries another account's CVs (read, change, copy, PDF, delete), team (every team route and billing), API key, embed and uploaded photo, and one embed user's CVs from another, the account owner and the app's own API. `pnpm test:e2e` (fixed to load `.env`; the app's setup is shared through `configureApp`).
- ✅ Subscriptions: past-due plans keep working for 14 days after the period ends (`PAST_DUE_GRACE_MS`), then fall back to the default plan until paid; canceled plans last to the period end; resubscribing after expiry starts a new checkout. Downgrades and switches are prorated by Paddle (`changePlan`).
- ✅ Deletion: an account can't be deleted while a paid plan renews or while it owns a team with other members; its personal organization, teams it owns alone, CVs and our stored files go with it; audit entries keep the anonymous id but lose its IP and browser. A team's own bucket keeps its files.
- ✅ Expiry: embed sessions last 60 minutes, launch tokens a minute, API keys until their expiry or revocation (checked on every request). An hourly housekeeping job clears expired launch tokens, email tokens and sessions, finished invites after 30 days, and old rate-limit counts.
- ✅ Rate limits shared between API instances with `RATE_LIMIT_STORE=database` (fixed windows in `RateLimitCounter`, one upsert per request), used by both the per-IP limit and the per-API-key limit; tested with two app instances. Memory stays the default for one instance.
- ✅ SSRF: a customer's storage endpoint is refused if it is, or resolves to, a private address (checked on each provider's first request).
- ✅ Indexes for the admin lists (users by sign-up, subscriptions by last change, active users) and for housekeeping; a redundant asset index dropped. Still to consider at scale: a trigram index for the users email/name search.

---

## Decisions to confirm before Phase 1

1. **Personal organization per user** (recommended above) vs. owner columns on each entity.
2. **Plan lineup.** The current pricing page says Free / Premium. The SaaS brief says Free / Personal / Pro / Business. Recommendation: keep Free and Premium public now and add Business when API and embedding exist. The catalog supports any lineup either way.
3. **Downgrade policy.** Recommendation: over-limit CVs stay fully editable and downloadable, and only creating new CVs is blocked.
4. **Unsaved-CV PDF downloads on Free at the CV limit.** Allow them (simpler), or require saving first? Allowing them means the CV limit isn't a download limit.
5. **Payment provider (Phase 2).** Merchant-of-record options (Paddle, Lemon Squeezy) handle EU VAT for you. Stripe gives more control. The abstraction keeps this swappable, but it affects checkout UX.
