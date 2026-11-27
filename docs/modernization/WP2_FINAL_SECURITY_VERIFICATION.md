# WP2 — Final Security Verification

**Date:** 27 November 2026  
**Verifier role:** Independent Application Security Engineer (read-only)  
**Scope:** WP2 authentication & authorization implementation  
**App versions under test:** Next.js `14.2.35`, `@clerk/nextjs@5.0.3`, Prisma `5.13`, Zod `3.23.5`  
**Method:** Source inspection + unauthenticated HTTP probes against production build (`next start`) + fresh `npm audit` + Clerk advisory/docs review  

Related: [`WP2_AUTHENTICATION_AUTHORIZATION_REPORT.md`](./WP2_AUTHENTICATION_AUTHORIZATION_REPORT.md) · [`SECURITY_GUIDELINES.md`](../architecture/SECURITY_GUIDELINES.md) · [`PHASE_0_BASELINE_REPORT.md`](./PHASE_0_BASELINE_REPORT.md) · [`AGENTS.md`](../../AGENTS.md)

**Constraints honored:** No source, dependency, schema, or environment changes. No WP3 work started.

---

## 1. Executive verdict

| Area | Result |
|------|--------|
| Unauthenticated API → **401 JSON** (no HTML redirect) | **PASS** — 7/7 handlers, 15 URL variants probed |
| Private pages → sign-in redirect | **PASS** — `/`, `/wizard`, `/transactions`, `/manage` → **307** |
| Public auth pages open | **PASS** — `/sign-in`, `/sign-up` → **200** |
| Server Action auth independent of middleware | **PASS** (code review) |
| Client-supplied user IDs not trusted | **PASS** (code review) |
| Ownership filters on mutations / reads | **PASS** (code review) |
| Live cross-user IDOR (User A vs User B) | **UNVERIFIED** — no dual test accounts; no production data used |
| Dependency critical/high residual risk | **OPEN** — see §6 |

### Approval recommendation

**Conditionally approve WP2** as meeting its stated authentication/authorization hardening goals.

Approve to close WP2 **only if** stakeholders accept the residual risks in §7 (notably Clerk `createRouteMatcher` CVE still present on `5.0.3`, Next.js advisories requiring major upgrade, and unverified live IDOR).

**Do not start WP3** until this verification is explicitly accepted.

---

## 2. Verification results (summary)

WP2’s layered model is present and consistent with [`SECURITY_GUIDELINES.md`](../architecture/SECURITY_GUIDELINES.md):

```text
clerkMiddleware
  → public /sign-in|/sign-up
  → /api/* pass-through (handlers return 401 JSON)
  → other pages: redirectToSignIn() when no userId
Layouts (dashboard, wizard): requirePageAuth()
Route Handlers: requireApiUserId() → 401 JSON
Server Actions: requireActionUser() → throw Unauthorized
Prisma: userId from Clerk session only
```

Unauthenticated HTTP evidence matches the WP2 report: private pages redirect; APIs return `{ "error": "Unauthorized" }` with `Content-Type: application/json` and **no** `Location` to an HTML sign-in page.

---

## 3. API coverage

### Inventory

All Route Handlers under `app/api/**/route.ts` (7 files). Every handler is **GET-only**.

| Endpoint | Auth helper | Query validation | Data scope |
|----------|-------------|------------------|------------|
| `/api/categories` | `requireApiUserId` | Zod `expense\|income\|null` → 400 | `category.userId` |
| `/api/user-settings` | `requireApiUserId` | N/A | `userSettings.userId`; create-on-GET if missing (**BUG-01**) |
| `/api/stats/balance` | `requireApiUserId` | `OverviewQuerySchema` → 400 | `transaction.userId` |
| `/api/stats/categories` | `requireApiUserId` | `OverviewQuerySchema` → 400 | `transaction.userId` |
| `/api/history-data` | `requireApiUserId` | timeframe/year/month Zod → 400 | `yearHistory` / `monthHistory.userId` |
| `/api/history-periods` | `requireApiUserId` | N/A | `monthHistory.userId` |
| `/api/transactions-history` | `requireApiUserId` | `OverviewQuerySchema` → 400 | settings + `transaction.userId` |

Auth is checked **before** validation in every handler (unauthenticated clients never reach Zod failure paths).

### Unauthenticated HTTP probes (executed)

Runtime: `npm run build` (existing) + `npm run start -- -p 3460`. Tooling: Node `fetch` with `redirect: "manual"`.

| Path | Status | Body / notes |
|------|--------|--------------|
| `/api/categories` | **401** | `{"error":"Unauthorized"}` · `application/json` · not HTML |
| `/api/categories?type=income` | **401** | same |
| `/api/categories?type=expense` | **401** | same |
| `/api/categories?type=invalid` | **401** | auth fails before 400 |
| `/api/user-settings` | **401** | same |
| `/api/stats/balance` | **401** | same |
| `/api/stats/balance?from=2024-01-01&to=2024-01-31` | **401** | same |
| `/api/stats/categories` | **401** | same |
| `/api/stats/categories?from=2024-01-01&to=2024-01-31` | **401** | same |
| `/api/history-data` | **401** | same |
| `/api/history-data?timeframe=month&year=2024&month=0` | **401** | same |
| `/api/history-data?timeframe=year&year=2024&month=0` | **401** | same |
| `/api/history-periods` | **401** | same |
| `/api/transactions-history` | **401** | same |
| `/api/transactions-history?from=2024-01-01&to=2024-01-31` | **401** | same |

**Page controls (same run):**

| Path | Status |
|------|--------|
| `/sign-in`, `/sign-up` | **200** HTML |
| `/`, `/wizard`, `/transactions`, `/manage` | **307** → `/sign-in?redirect_url=...` |

**Coverage conclusion:** Every applicable API endpoint was probed unauthenticated. **100% of handlers return 401 JSON with no HTML redirect.**

Authenticated happy-path and authenticated invalid-query (**400**) responses were **not** live-tested (no session credentials in this read-only verification).

---

## 4. Server Action coverage

### Inventory (all `"use server"` modules)

| Action | File | Auth | Validation | Ownership |
|--------|------|------|------------|-----------|
| `CreateTransaction` | `app/(dashboard)/_actions/transactions.ts` | `requireActionUser()` | `CreateTransactionSchema` | Writes `userId: user.id`; category lookup `userId + name + type` |
| `CreateCategory` | `app/(dashboard)/_actions/categories.ts` | `requireActionUser()` | `CreateCategorySchema` | Creates with `userId: user.id` |
| `DeleteCategory` | same | `requireActionUser()` | `DeleteCategorySchema` | Delete via `name_userId_type` composite |
| `DeleteTransaction` | `app/(dashboard)/transactions/_actions/deleteTransaction.ts` | `requireActionUser()` | `DeleteTransactionIdSchema` (UUID) | Pre-read + delete include `userId: user.id`; history updates keyed with `userId` |
| `UpdateUserCurrency` | `app/wizard/_actions/userSettings.ts` | `requireActionUser()` | `UpdateUserCurrencySchema` | `where: { userId: user.id }` |

### Checks

| Check | Result |
|-------|--------|
| Auth independent of middleware | **PASS** — each action calls `requireActionUser()` → `currentUser()` |
| Client-supplied user IDs | **PASS** — no `userId` accepted from forms/args (repo grep of form/body-assigned userId: none) |
| Ownership on mutations | **PASS** — all writes/deletes scoped to Clerk `user.id` |
| Invalid input rejected | **PASS** — Zod `safeParse` → `"bad request"` before DB writes |
| Unauthorized cannot modify | **PASS** (logic) — missing user throws `"Unauthorized"` before Prisma |

### Notes / residual action risks

1. **Live unauthenticated Server Action invocation** was not HTTP-tested (Next Action protocol + Clerk cookie required). Conclusion is code-review based.
2. `DeleteTransaction` uses `findUnique` / `delete` with `{ id, userId }`. Transaction `@id` is `id` only; Prisma allows additional unique-where filters when enabled — ownership is still enforced on delete. Prefer documenting / ensuring this stays type-safe across Prisma upgrades.
3. Action errors are thrown strings (`Unauthorized` / `bad request`), not structured HTTP codes — acceptable for Server Actions; ensure client UI does not leak stack traces in production.

**Automated:** `npm test` → **6 passed** (`lib/__tests__/security-validation.test.ts`) — schema/contract only; not a substitute for Clerk session E2E.

---

## 5. Data isolation (IDOR) findings

### Code review (PASS with caveats)

| Domain | Isolation mechanism |
|--------|---------------------|
| Categories | All API/action paths filter or key by `userId` |
| Transactions | Create/delete/list/stats use authenticated `userId` |
| User settings | `findUnique` / `update` / create-on-GET by `userId` |
| Month/Year history | Composite IDs include `userId`; upserts/updates use session user |

No API or action trusts a client-provided user identifier.

### Live dual-user testing

| Item | Status |
|------|--------|
| Test Clerk accounts available for verifier | **No** |
| Production / real financial records used | **Never** (forbidden and unused) |
| User A cannot read/modify/delete User B data | **UNVERIFIED** |

Isolation can be tested without production credentials by provisioning **two disposable Clerk test users** against a non-production database and running authenticated API/action cross-access attempts (Phase 5 / Playwright recommended). Until then, treat cross-tenant isolation as **code-reviewed only**.

---

## 6. npm audit analysis

**Command:** `npm audit --json` (fresh run during this verification)  

**Summary:** `critical: 4` · `high: 19` · `moderate: 8` · `low: 1` · **total: 32**

No forced upgrades were applied.

### 6.1 Critical findings

#### 1. `@clerk/nextjs@5.0.3` (direct, **production**)

| Field | Value |
|-------|-------|
| Installed | `5.0.3` |
| Direct / transitive | **Direct** |
| Path | `good_budget → @clerk/nextjs` |
| Identifier | [GHSA-vqx2-fgx2-5wq9](https://github.com/advisories/GHSA-vqx2-fgx2-5wq9) / CVE-2026-41248 |
| Title | Middleware-based route protection bypass via `createRouteMatcher` |
| Affected range | `>=5.0.0 <5.7.6` |
| Patched version | **`5.7.6`** (same major) |
| Production impact | **Yes** |

**Analysis:** Advisory states crafted requests can skip middleware gating. Sessions are not stolen. Downstream `auth()` checks in handlers/layouts/actions remain valid. GoodBudget uses the **public-route allowlist** pattern (`if (isPublicRoute) return; else redirect`), which Clerk documents as **blocking the bypass at middleware**; plus layouts/APIs/actions re-check auth. Residual risk is lower than apps that only gate with `if (isProtectedRoute) protect()`, but **upgrade to `5.7.6+` remains strongly recommended**.

#### 2. `next@14.2.35` (direct, **production**)

| Field | Value |
|-------|-------|
| Installed | `14.2.35` |
| Direct / transitive | **Direct** |
| Path | `good_budget → next` (also peer of `@clerk/nextjs`) |
| Identifiers (critical among many) | [GHSA-p293-qw3h-jr36](https://github.com/advisories/GHSA-p293-qw3h-jr36) (Windows RCE), [GHSA-2xp9-vwfh-vxw4](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4) (Image Optimizer AVIF RCE), [GHSA-2464-fhr4-w9xw](https://github.com/advisories/GHSA-2464-fhr4-w9xw) (Image Optimizer SVG RCE); plus multiple **high** DoS/SSRF/Server Action issues |
| npm suggested fix | `next@16.4.6` (**semver major**) |
| Practical 15.x floor | Many advisories list patches from **15.5.x** line (e.g. 15.5.21–15.5.28 depending on CVE) — **not** available as a clean stay-on-14 path |
| Production impact | **Yes** (severity depends on host OS, image formats, custom server, rewrites) |

**Remediation:** Deferred to planned Next major work package (WP3+ / Next 15.5+/16). Do not force-upgrade in WP2.

#### 3. `vitest@2.1.9` (direct, **development**)

| Field | Value |
|-------|-------|
| Path | `good_budget → vitest` |
| Identifiers | [GHSA-5xrq-8626-4rwp](https://github.com/advisories/GHSA-5xrq-8626-4rwp) (Vitest UI arbitrary file read/exec), [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9) |
| Fix | `vitest@4.1.12` (major) |
| Production impact | **No** (devDependency; risk if Vitest UI exposed on a network) |

#### 4. `tinypool@1.1.1` (transitive, **development**)

| Field | Value |
|-------|-------|
| Path | `vitest → tinypool` |
| Identifiers | [GHSA-5gmw-xhrv-c9v3](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3), [GHSA-85c8-ppgw-ccpr](https://github.com/advisories/GHSA-85c8-ppgw-ccpr) |
| Fix | via `vitest@4.1.12` |
| Production impact | **No** |

### 6.2 High findings (production-relevant first)

| Package | Installed | Direct? | Scope | Path / notes | Advisory / fix |
|---------|-----------|---------|-------|--------------|----------------|
| `@clerk/backend` | `1.1.0` | Transitive | Prod | `@clerk/nextjs → @clerk/backend` | Fix via Clerk upgrade |
| `@clerk/clerk-react` | `5.0.1` | Transitive | Prod | `@clerk/nextjs → @clerk/clerk-react` | Fix via Clerk upgrade |
| `@clerk/shared` | `2.0.0` | Transitive | Prod | Clerk tree (`js-cookie`) | Fix via Clerk upgrade; path matcher CVE fixed in newer `@clerk/shared` |
| `path-to-regexp` | `6.2.1` | Transitive | Prod | Clerk matcher dependency | [GHSA-9wv6-86v2-598j](https://github.com/advisories/GHSA-9wv6-86v2-598j); fix via Clerk upgrade (`>=6.3.0`) |
| `js-cookie` | (via shared) | Transitive | Prod | `@clerk/shared → js-cookie` | Address with Clerk bump |
| `zod` | `3.23.5` | **Direct** | Prod | `good_budget → zod` | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) memory exhaustion on oversized collections; fix `zod@4.6.6+` (**major**) — schedule carefully |
| `postcss` | nested under `next` / top-level audit node | Mixed | Build/runtime toolchain | Affects `next` tree | File-read via sourcemap URLs; remediate with Next upgrade |
| `vite` | `5.4.21` | Transitive | **Dev** | `vitest → vite` | Dev-server / Windows editor issues; fix with Vitest major |
| `eslint-config-next` / `@next/eslint-plugin-next` / `glob` | `14.2.35` / `10.3.10` | Dev / transitive | **Dev** | Lint toolchain | Fix tracks Next major |
| `brace-expansion`, `braces`, `minimatch`, `picomatch`, `cross-spawn`, `flatted`, `js-yaml`, `lodash` | various | Transitive | Mixed (many lint/build) | ReDoS / prototype pollution class issues | Prefer upstream bumps; low runtime exploitability for this app’s request path |

### 6.3 Recommended remediation (no auto-apply)

1. **Near-term (compatible):** Upgrade `@clerk/nextjs` to **`5.7.6+`** within v5 (addresses GHSA-vqx2-fgx2-5wq9; validate `redirectToSignIn` / middleware still behave).  
2. **Planned major:** Next **15.5.x LTS floor or 16.x** per roadmap (clears Next critical/high cluster).  
3. **Dev hygiene:** Plan Vitest **4.1.12+** when convenient; do not expose Vitest UI remotely.  
4. **Zod 4:** Separate compatibility WP — not a WP2 blocker.  
5. Avoid `npm audit fix --force`.

---

## 7. Clerk 5.0.3 integration review

### Observed implementation

| Surface | Finding |
|---------|---------|
| File | `middleware.ts` (correct for Next 14; not `proxy.ts`) |
| API | `clerkMiddleware((auth, req) => …)` with synchronous `auth()` — matches **5.0.3** callback style |
| Matchers | `createRouteMatcher` for public + API classification |
| Pages | Unauthenticated → `redirectToSignIn()` |
| APIs | Middleware does **not** redirect; handlers return 401 JSON |
| Layouts | `requirePageAuth()` in `app/(dashboard)/layout.tsx` and `app/wizard/layout.tsx` |
| Root | `ClerkProvider` in `app/layout.tsx` |
| Actions / APIs | Resource-level `currentUser()` / `auth()` via `lib/auth.ts` |

### Compatible vs current Clerk docs

| Topic | Assessment |
|-------|------------|
| `createRouteMatcher` | **Deprecated** in current Clerk docs (runtime warning on newer SDKs; migrate to resource-based checks before next major). Still functional on 5.0.3; WP2 uses it intentionally. |
| Resource-level checks | **Present** — aligns with Clerk’s recommended defense-in-depth / migration direction |
| `auth().protect()` | Avoided — WP2 correctly noted 404 UX on this SDK version for document requests |
| Matcher config | Standard Clerk/Next matcher including `/(api\|trpc)(.*)` |
| GHSA-vqx2-fgx2-5wq9 | Installed version **vulnerable**; public-allowlist pattern + resource checks **mitigate practical impact**; patch to **5.7.6** still required |

### Gaps

1. Not yet on patched Clerk **5.7.6**.  
2. Continued reliance on matcher-based page gating (acceptable short-term; plan migration off `createRouteMatcher` during Clerk/Next major upgrades).  
3. No `__clerk` matcher entry from newest docs — low risk for this app unless using Clerk frontend API routes that require it.  
4. Authenticated E2E against Clerk test users still missing.

---

## 8. Remaining security risks

| ID | Risk | Severity | WP2 status |
|----|------|----------|------------|
| R-01 | Clerk middleware matcher bypass CVE on `5.0.3` | Critical (mitigated by pattern + resource checks) | Open — patch recommended |
| R-02 | Next.js critical/high advisories remaining on 14.2.35 | Critical/High (environment-dependent) | Deferred to Next major WP |
| R-03 | Live dual-user IDOR unproven | High (uncertainty) | Unverified |
| R-04 | BUG-01 create-on-GET `/api/user-settings` | Medium | Deferred WP5 |
| R-05 | Float money precision (DATA-01) | Medium (integrity) | Out of WP2 scope |
| R-06 | Zod 3 collection DoS advisory | High (needs large crafted input) | Open — Zod 4 later |
| R-07 | Vitest/tinypool critical (dev) | Critical in CI/dev misuse scenarios | Dev-only |
| R-08 | No authenticated API/action penetration test | Process gap | Open |

---

## 9. Recommended next actions

1. **Accept or reject** this verification (gate for WP3).  
2. Schedule **`@clerk/nextjs@5.7.6+`** as a small follow-up security patch (still within Clerk v5 / Next 14 constraints if peer range allows — verify before applying).  
3. Add **two Clerk test users** + non-prod DB script or Playwright suite for IDOR (read/update/delete cross-user).  
4. Keep **Next major** and **Zod 4** on the modernization roadmap; do not bundle into WP2.  
5. When upgrading Clerk majors, migrate off `createRouteMatcher` auth gates toward resource-only checks per Clerk migration guide.  
6. Do **not** begin WP3 until approval.

---

## 10. Explicit approval recommendation

| Question | Answer |
|----------|--------|
| Did WP2 deliver the intended authz/authn hardening? | **Yes** |
| Are unauthenticated APIs safe from HTML redirect leakage? | **Yes** (HTTP-proven) |
| Are private pages gated? | **Yes** (HTTP-proven) |
| Is tenant isolation proven end-to-end? | **No — code review only** |
| Are dependency criticals cleared? | **No** |
| **Approve WP2 closure?** | **Conditional YES** — close WP2 with R-01–R-08 accepted as residual / follow-up |
| **Approve starting WP3?** | **NO — wait for explicit human approval** |

---

## 11. Evidence appendix

| Evidence | Result |
|----------|--------|
| Source review of 7 API routes + 5 Server Actions + `middleware.ts` + `lib/auth.ts` + layouts | Complete |
| Unauthenticated probes | 15 API URL variants + 6 pages |
| `npm test` | 6/6 passed |
| `npm audit` | 32 findings (4 critical, 19 high) |
| Clerk advisory GHSA-vqx2-fgx2-5wq9 | Reviewed against public-allowlist pattern |
| Production user data | Not accessed |

*End of independent WP2 final security verification.*
