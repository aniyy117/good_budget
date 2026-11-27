# WP2 — Authentication & Authorization Hardening Report

**Date:** 27 November 2026  
**Work package:** WP2  
**Clerk SDK:** `@clerk/nextjs@5.0.3` (unchanged — no breaking Clerk upgrade)  
**Next.js:** 14.2.35 (from WP1)

Related: [`PHASE_0_BASELINE_REPORT.md`](./PHASE_0_BASELINE_REPORT.md) · [`WP1_NEXTJS_SECURITY_UPGRADE_REPORT.md`](./WP1_NEXTJS_SECURITY_UPGRADE_REPORT.md) · [`SECURITY_GUIDELINES.md`](../architecture/SECURITY_GUIDELINES.md)

---

## 1. Verdict

| Criterion | Result |
|-----------|--------|
| Private pages require auth | **Yes** — `/`, `/wizard`, `/transactions`, `/manage` → **307** to sign-in when logged out |
| Public auth routes | **Yes** — `/sign-in`, `/sign-up` → **200** |
| Unauthenticated APIs return **401 JSON** | **Yes** — `{ "error": "Unauthorized" }` |
| Server Actions check auth independently | **Yes** — `requireActionUser()` |
| Cross-user Prisma scoping reviewed | **Yes** — `userId` filters retained; category create lookup now includes `type` |
| Schema / financial formulas changed | **No** (category `type` filter is ownership integrity, not formula change) |
| WP2 ready for approval | **Yes** (with documented residual risks) |

**Do not start WP3 or Next 16** until explicitly approved.

---

## 2. Security issues fixed

| Issue | Before (Phase 0/WP1) | After WP2 |
|-------|----------------------|-----------|
| SEC-02 Bare middleware | `clerkMiddleware()` only | Public matcher + `redirectToSignIn()` for private pages |
| SEC-03 `/manage`, `/transactions` open | HTTP **200** logged out | HTTP **307** → `/sign-in` |
| SEC-04 API redirect | HTTP **307** HTML redirect | HTTP **401** JSON |
| BUG-02 Category type | Lookup by name only | Lookup by `userId` + `name` + `type` |
| Delete id validation | Raw string | Zod UUID (`DeleteTransactionIdSchema`) |
| Action unauth UX | `redirect("/sign-in")` | `throw new Error("Unauthorized")` for mutations |
| stats/categories validation | `throw` → opaque 500 | Stable **400** JSON |

---

## 3. Authentication architecture

### Clerk 5.0.3 notes

- Keep `middleware.ts` (Next 14; not `proxy.ts`).
- Middleware callback API: `clerkMiddleware((auth, req) => { ... })` with `auth()` → `{ userId, redirectToSignIn, protect }`.
- **`auth().protect()` in this SDK version returned 404** for unauthenticated document requests during verification — product UX requires sign-in redirect, so WP2 uses **`redirectToSignIn()`** in middleware and **`redirect("/sign-in")`** in layouts via `requirePageAuth()`.
- `createRouteMatcher` used for path classification (available in 5.0.3). Newer Clerk docs deprecate matcher-based *auth gates* in favor of resource checks; WP2 still applies **resource-level** checks in layouts, APIs, and actions (defense in depth).

### Layers

```text
Request
  → clerkMiddleware
       · public: /sign-in, /sign-up
       · /api/*: pass through (handler returns 401 JSON)
       · other pages: redirectToSignIn if no userId
  → Layouts (dashboard, wizard): requirePageAuth()
  → Pages / Route Handlers / Server Actions: userId from Clerk session only
  → Prisma: always filter by user.id
```

### Helpers

[`lib/auth.ts`](../../lib/auth.ts):

- `requireApiUserId()` — 401 JSON for Route Handlers  
- `requirePageAuth()` — redirect for pages/layouts  
- `requireActionUser()` — throw for Server Actions  

---

## 4. API security changes

All seven GET handlers updated:

- `app/api/categories/route.ts`
- `app/api/user-settings/route.ts`
- `app/api/stats/balance/route.ts`
- `app/api/stats/categories/route.ts`
- `app/api/history-data/route.ts`
- `app/api/history-periods/route.ts`
- `app/api/transactions-history/route.ts`

**Breaking change (intentional):** unauthenticated clients that previously followed a **307** to HTML sign-in now receive **401** `{ "error": "Unauthorized" }`. Authenticated browser app (React Query after Clerk session) is unchanged.

Validation errors prefer stable `{ error: "..." }` messages (avoid dumping full Zod trees).

**Preserved:** create-on-GET for user-settings (BUG-01 / WP5).

---

## 5. Server Action security changes

| Action | Change |
|--------|--------|
| `CreateTransaction` | `requireActionUser`; category filter adds `type`; generic bad-request errors |
| `CreateCategory` / `DeleteCategory` | `requireActionUser` |
| `DeleteTransaction` | UUID Zod + `requireActionUser` + ownership check retained |
| `UpdateUserCurrency` | `requireActionUser`; stable bad-request on invalid currency |

Client-supplied user IDs are never accepted.

---

## 6. Data isolation verification (code review)

| Area | Ownership enforcement |
|------|------------------------|
| Transactions create/delete | `userId: user.id` on write/delete; delete pre-read scoped by user |
| Categories | Unique `(name, userId, type)`; creates set `userId` |
| User settings | `where: { userId }` |
| Stats / history APIs | All queries take `authResult.userId` |
| Month/Year history | Composite keys include `userId` |

**Not executed:** live User A vs User B isolation with two Clerk accounts (requires interactive multi-user setup).

---

## 7. Tests executed and results

### Automated (Vitest) — executed

```text
npm test → 6 passed
```

Coverage: UUID delete ids, invalid transaction/category payloads, currency allowlist, 401 body contract documentation.

**Limitation:** Vitest cannot exercise real Clerk sessions / middleware redirects. Cross-user Prisma isolation and logged-in happy paths need Playwright + Clerk test users (Phase 5).

### HTTP smoke (unauthenticated `next start`) — executed

| Path | Status | Notes |
|------|--------|-------|
| `/sign-in`, `/sign-up` | 200 | Public |
| `/`, `/wizard`, `/transactions`, `/manage` | **307** → sign-in | Private (was 200 for manage/transactions) |
| `/api/categories`, `/api/user-settings`, `/api/stats/balance`, `/api/transactions-history` | **401** JSON | Was 307 |

### Static verification — executed

| Check | Result |
|-------|--------|
| `npm run lint` | Pass (2 pre-existing date-picker warnings) |
| `npx tsc --noEmit` | Pass |
| `npm run build` | Pass |
| `npm audit` | **32** total (4 critical) — includes Vitest transitive; Next/Clerk residuals remain from WP1 |

---

## 8. Remaining vulnerabilities / risks

1. Next/Clerk `npm audit` findings beyond 14.2.35 (major upgrade path).  
2. BUG-01 create-on-GET user-settings.  
3. No authenticated E2E / dual-user IDOR lab run.  
4. Float money precision (DATA-01).  
5. Vitest added slight audit surface (devDependency).  
6. Future Clerk majors may push fully resource-based auth and deprecate matcher patterns — plan during WP10.

---

## 9. Files modified

| Path | Role |
|------|------|
| `middleware.ts` | Route protection |
| `lib/auth.ts` | Shared auth helpers (**new**) |
| `app/(dashboard)/layout.tsx` | Page auth |
| `app/wizard/layout.tsx` | Page auth |
| `app/api/**/route.ts` | 401 JSON |
| `app/(dashboard)/_actions/*` | Action auth + category type |
| `app/(dashboard)/transactions/_actions/deleteTransaction.ts` | UUID + auth |
| `app/wizard/_actions/userSettings.ts` | Action auth |
| `schema/transaction.ts` | `DeleteTransactionIdSchema` |
| `lib/__tests__/security-validation.test.ts` | Security unit tests (**new**) |
| `vitest.config.ts` | Test runner config (**new**) |
| `package.json` / lockfile | `vitest` + `test` scripts |
| Docs listed in §10 | Status updates |

---

## 10. Documentation updates

- This report  
- `docs/architecture/SECURITY_GUIDELINES.md`  
- `docs/modernization/EXECUTION_PLAN.md`  
- `docs/modernization/MIGRATION_RISK_ASSESSMENT.md`  
- `docs/modernization/MODERNIZATION_ROADMAP.md`  
- `AGENTS.md` (auth section)

---

## 11. Rollback

```bash
git checkout HEAD -- middleware.ts app/api app/\(dashboard\) app/wizard lib/auth.ts schema/transaction.ts
# Remove new files if reverting entirely:
#   lib/auth.ts lib/__tests__ vitest.config.ts
```

Prefer reverting the WP2 commit/PR once committed.

---

## 12. Completion checklist

- [x] Private routes protected  
- [x] Public sign-in/up remain open  
- [x] API 401 JSON  
- [x] Server Action auth + validation  
- [x] Data isolation reviewed  
- [x] Automated validation tests + HTTP smoke  
- [x] lint / tsc / build  
- [x] Docs updated  
- [x] No Next 16 / no Prisma migrations  
