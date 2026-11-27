# GoodBudget — Next.js Application Audit & Technical Assessment

**Canonical location:** [`docs/audit/NEXTJS_APPLICATION_AUDIT.md`](./NEXTJS_APPLICATION_AUDIT.md)  
**Audit date:** 27 November 2026  
**Last verified against repo:** 27 November 2026 (still on Next.js **14.2.3** / React **18**; Next.js **16** modernization not started)  
**Repository:** `good_budget`  
**Remote:** `https://github.com/aniyy117/good_budget.git`  
**Scope:** Read-only codebase audit (no application code changes).  
**Related docs:** [`AGENTS.md`](../../AGENTS.md) · [`MODERNIZATION_ROADMAP.md`](../modernization/MODERNIZATION_ROADMAP.md) · [`APPLICATION_ARCHITECTURE.md`](../architecture/APPLICATION_ARCHITECTURE.md)  
**Evidence basis:** Source review, `package-lock.json` versions, `next lint`, production `next build`, `npm audit`, public CVE advisories; cross-checked with parallel explore passes.

> **Current vs target:** This audit describes the **current** Next.js 14 App Router application. The product target is a phased upgrade to **Next.js 16**. Do not assume Next 16 APIs are already in use.

---

## 1. Executive Summary

GoodBudget is a personal finance tracker built with **Next.js 14 App Router**, **React 18**, **Clerk** authentication, **Prisma + PostgreSQL**, **TanStack Query**, and a large **shadcn/ui** surface. The product flow is: Clerk sign-in/up → currency wizard → dashboard (overview + history charts) → transactions table → manage categories/currency.

**Strengths (confirmed):**

- Clear App Router route-group structure (`(auth)`, `(dashboard)`, `wizard`, `api`).
- Mutations use Server Actions with Zod validation and consistent `userId` scoping on Prisma writes/deletes.
- TypeScript `strict: true`; production build compiles and type-checks successfully.
- `next/font` (Inter) is used correctly; root metadata exists.

**Critical / high-risk findings (confirmed):**

1. **Next.js `14.2.3` is below patched 14.2.x security releases** (middleware auth bypass, RSC DoS, image-cache issues, SSRF, etc.). Upgrade urgently (recommend **≥ 14.2.35** on the 14.x line, or a current supported major).
2. **`clerkMiddleware()` has no route protection** — auth is ad hoc in pages/API handlers; `/manage` and `/transactions` are fully client pages with **no server-side auth gate**.
3. **API routes use `redirect("/sign-in")` for unauthenticated requests** instead of `401`, and client `fetch` calls rarely check `res.ok` — silent failure / HTML-as-JSON risk.
4. **Dashboard First Load JS is very large** (`/` ≈ **426 kB** First Load; Recharts + emoji-mart + heavy client trees).
5. **Zero automated tests** and **no CI workflows** in-repo.
6. **`npm audit` reports 30 vulnerabilities** (2 critical, 22 high) including Next and Clerk dependency trees.

**Overall readiness for modernization:** Good functional baseline; not production-hardened. Treat security upgrades and auth middleware as Phase 1 before feature work.

---

## 2. Application Architecture Overview

```text
Browser
  └─ RootLayout (ClerkProvider + Theme + React Query)
       ├─ (auth)/sign-in|sign-up          → Clerk components
       ├─ wizard                          → RSC page + CurrencyComboBox (CSR)
       ├─ (dashboard)/                    → Navbar + pages
       │    ├─ /                          → RSC gate + Overview/History CSR
       │    ├─ /transactions              → full CSR page + table
       │    └─ /manage                    → full CSR page + categories
       └─ /api/*                          → Route Handlers (Prisma + Clerk)

Writes: Client → Server Actions ("use server") → Prisma (+ history aggregates)
Reads:  Client → React Query → /api/* → Prisma
```

**Hybrid rendering model:**

| Surface | Strategy |
|---------|----------|
| `/`, `/wizard` | **SSR/RSC** (dynamic) with `currentUser()` + Prisma |
| `/manage`, `/transactions` | **CSR** (`"use client"` page) |
| Dashboard widgets | **CSR** via React Query against Route Handlers |
| Mutations | **Server Actions** |
| Auth middleware | Present but **does not enforce** protection |

All App Router routes reported by `next build` as **ƒ Dynamic** (server-rendered on demand). No SSG/ISR usage observed.

---

## 3. Current Technology Stack and Versions

| Package | Declared | Locked (`package-lock.json`) |
|---------|----------|------------------------------|
| `next` | `14.2.3` | **14.2.3** |
| `react` / `react-dom` | `^18` | **18.3.1** |
| `@clerk/nextjs` | `^5.0.3` | **5.0.3** |
| `@prisma/client` / `prisma` | `^5.13.0` | **5.13.0** |
| `@tanstack/react-query` | `^5.32.1` | **5.32.1** |
| `@tanstack/react-table` | `^8.16.0` | (lockfile) |
| `zod` | `^3.23.5` | (lockfile) |
| `typescript` | `^5` | **5.4.5** |
| `eslint` | `^8` | **8.57.0** |
| `eslint-config-next` | `14.2.3` | matches Next |
| `tailwindcss` | `^3.4.1` | (lockfile) |
| `recharts` | `^2.12.6` | charts |
| `@emoji-mart/react` + data | ^1.x | category icons |
| `next-themes` | `^0.3.0` | theming |
| `sonner` | `^1.4.41` | toasts |
| `react-hook-form` + `@hookform/resolvers` | forms | |
| Radix / shadcn | many `@radix-ui/*` | UI kit |

**Database:** PostgreSQL via Prisma (`POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`) — typical Vercel Postgres / Neon pooled + direct URL pattern.

**Third-party integrations:**

- **Clerk** — auth UI, `ClerkProvider`, `UserButton`, `clerkMiddleware`, `currentUser()`.
- **Prisma** — ORM + migrations under `prisma/migrations/`.
- **TanStack Query** — client data cache; Devtools always mounted in `RootProviders`.
- **shadcn/ui** — `components.json` style `default`, baseColor `zinc`, RSC-enabled.
- **Recharts** — history bar chart.
- **emoji-mart** — category icon picker.
- **export-to-csv** — transactions export.

**Local tooling installed during this audit (not part of app):**

- Node via **nvm** (default **Node 20.20.2**; also installed 26.x).
- **Vercel CLI 67.0.0** (`npm i -g vercel`) for `vercel env pull`.

---

## 4. Folder Structure and Module Breakdown

```text
good_budget/
├── app/
│   ├── layout.tsx                 # Root: Clerk, Inter font, Toaster, RootProviders
│   ├── globals.css
│   ├── favicon.ico
│   ├── (auth)/
│   │   ├── layout.tsx             # Centered Logo shell
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx             # Navbar + children
│   │   ├── page.tsx               # Home dashboard (RSC)
│   │   ├── manage/page.tsx        # Currency + categories (CSR)
│   │   ├── transactions/
│   │   │   ├── page.tsx           # History page (CSR)
│   │   │   ├── _components/       # Table, delete dialog
│   │   │   └── _actions/deleteTransaction.ts
│   │   ├── _components/           # Overview, History, dialogs, stats
│   │   └── _actions/              # categories.ts, transactions.ts
│   ├── wizard/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Onboarding currency (RSC)
│   │   └── _actions/userSettings.ts
│   └── api/
│       ├── categories/route.ts
│       ├── user-settings/route.ts
│       ├── transactions-history/route.ts
│       ├── history-data/route.ts
│       ├── history-periods/route.ts
│       └── stats/{balance,categories}/route.ts
├── components/
│   ├── common/                    # Navbar, Logo, CurrencyComboBox, Theme, Skeleton
│   ├── datatable/                 # Column header/toggle/faceted filters
│   ├── providers/RootProviders.tsx
│   └── ui/                        # shadcn primitives (~49 modules; many unused)
├── hooks/use-media-query.ts
├── lib/                           # prisma, helpers, currencies, types, utils, constants
├── schema/                        # Zod: transaction, categories, overview, userSettings
├── prisma/schema.prisma + migrations/
├── public/                        # next.svg, vercel.svg (scaffold leftovers)
├── middleware.ts
├── next.config.mjs                # empty `{}`
├── tsconfig.json                  # strict
├── .eslintrc.json                 # next/core-web-vitals
└── package.json
```

### Routes (confirmed)

| Route | File | Notes |
|-------|------|-------|
| `/` | `app/(dashboard)/page.tsx` | Auth + settings gate; income/expense CTAs |
| `/transactions` | `app/(dashboard)/transactions/page.tsx` | Client-only |
| `/manage` | `app/(dashboard)/manage/page.tsx` | Client-only |
| `/wizard` | `app/wizard/page.tsx` | Currency onboarding |
| `/sign-in/[[...sign-in]]` | auth catch-all | Clerk `<SignIn />` |
| `/sign-up/[[...sign-up]]` | auth catch-all | Clerk `<SignUp />` |
| `/api/categories` | GET | List categories by optional type |
| `/api/user-settings` | GET | Get-or-create settings (side effect) |
| `/api/transactions-history` | GET | Date-range transactions + formatted amount |
| `/api/history-data` | GET | Month/year chart series |
| `/api/history-periods` | GET | Distinct years for selectors |
| `/api/stats/balance` | GET | Income/expense totals |
| `/api/stats/categories` | GET | Grouped category totals |

### Prisma models (confirmed)

- **UserSettings** — `userId` PK, `currency`
- **Category** — unique `(name, userId, type)`; no relation to Transaction
- **Transaction** — UUID id; denormalized `category` + `categoryIcon`; `Float` amounts; typo field `updateAt`
- **MonthHistory** / **YearHistory** — composite PK aggregates maintained in Server Actions

---

## 5. Existing Implementation Analysis

### 5.1 Application flow

1. Unauthenticated user hits protected page → today: **page-level** `currentUser()` redirect on `/` and `/wizard` only; middleware does **not** force sign-in.
2. After Clerk auth, `/` loads settings; missing → redirect `/wizard`.
3. Wizard shows `CurrencyComboBox`, which **GET `/api/user-settings`** and **auto-creates** `UserSettings` with default **`INR`** if absent.
4. User may change currency via Server Action `UpdateUserCurrency`, then link to `/`.
5. Dashboard Overview drives date range → parallel React Query fetches for balance + category stats; History fetches periods + chart data.
6. Create income/expense via `CreateTransaction` Server Action; updates `Transaction` + month/year history upserts.
7. Transactions page: filterable/sortable table, CSV export, delete via `DeleteTransaction` (also decrements aggregates).
8. Manage: currency + create/delete categories.

### 5.2 Server Actions

| Action | Path | Validation | Auth |
|--------|------|------------|------|
| `CreateTransaction` | `app/(dashboard)/_actions/transactions.ts` | Zod | `currentUser` |
| `CreateCategory` / `DeleteCategory` | `app/(dashboard)/_actions/categories.ts` | Zod | `currentUser` |
| `DeleteTransaction` | `.../deleteTransaction.ts` | **id unvalidated** | `currentUser` + ownership check |
| `UpdateUserCurrency` | `app/wizard/_actions/userSettings.ts` | Zod currency | `currentUser` |

### 5.3 Data fetching / caching

- No Next.js `fetch` cache / `revalidate` / `unstable_cache` patterns for dashboard data.
- React Query `QueryClient` created with **empty defaults** (no `staleTime`) → frequent refetches on remount/focus.
- `revalidatePath("/")` only in `GET /api/user-settings` (odd on a GET).
- Create transaction invalidates `["overview"]` only — **not** `["transactions"]`.
- Delete transaction invalidates `["transactions"]` only — **not** overview/history.
- Currency update does not invalidate related queries beyond toast UI.

### 5.4 Rendering / component boundaries

**Justified client components:** interactive dialogs, charts, table, navbar pathname, theme switcher, media-query currency picker.

**Unnecessary / suboptimal client boundaries (confirmed):**

- Entire `manage/page.tsx` and `transactions/page.tsx` are `"use client"` — static headers could be RSC with client islands.
- `Overview.tsx` is a thin client shell for date state; acceptable but pulls child trees into client graph.

### 5.5 Config

- `next.config.mjs`: empty — no `images`, headers, experimental flags, or bundle analyzer.
- README is **create-next-app boilerplate** (mentions `app/page.tsx` / Inter tutorial) — not product docs.
- No `.env.example` in repo; `.env` gitignored; no `.vercel` link present locally at audit time.

---

## 6. Issues and Technical Debt

Issues below are tagged **CONFIRM** (evidence in code/build) or **POTENTIAL** (likely improvement / needs runtime verification).

### Confirmed functional / correctness issues

| ID | Issue |
|----|-------|
| BUG-01 | `GET /api/user-settings` **creates** settings with `INR` → visiting wizard auto-completes onboarding; dashboard gate can be skipped without intentional currency choice. |
| BUG-02 | `CreateTransaction` category lookup uses `userId` + `name` **without `type`** → can attach wrong category icon/type when same name exists for income and expense. |
| BUG-03 | Incomplete React Query invalidation between create/delete transaction and overview/history/transactions views. |
| BUG-04 | `CreateTransactionDialog` mutation has **no `onError`** handler (loading toast may stick). |
| BUG-05 | Client fetches generally `.then(res => res.json())` **without `res.ok`** — auth redirects return HTML, parsed as JSON failures / empty UI. |
| BUG-06 | `CategoriesStats` leaves `console.log(percentage)` in production path. |
| BUG-07 | Prisma `Transaction.updateAt` typo; never auto-updated on change (default `now()` only). |
| BUG-08 | Money stored as `Float` — floating-point drift risk for financial amounts. |
| BUG-09 | No DB indexes on `Transaction(userId, date)` (or Category `userId`) — scale risk. |
| BUG-10 | Deleting a category does **not** handle existing transactions referencing that category name (orphaned labels). |
| BUG-11 | `UpdateUserCurrency` uses `update` not `upsert` — fails if settings row missing (mitigated only because GET creates first). |
| BUG-12 | Wizard copy: `Let &apos;s` renders awkward apostrophe spacing. |
| BUG-13 | `CurrencyComboBox` currency mutation does **not** invalidate `["userSettings"]`; dashboard formatters use RSC-passed `userSettings` → stale currency until remount/navigation. |
| BUG-14 | `CreateCategoryDialog` emoji `Popover` uses controlled `open={isOpenEmojiPicker}` **without `onOpenChange`** — dismiss/outside-click behavior broken or awkward. |
| BUG-15 | `CategoryPicker` syncs selection via `useEffect(value → onChange)` instead of calling `onChange` in the select handler (effect antipattern). |
| BUG-16 | `GET /api/stats/categories` **throws** on validation failure (unlike sibling routes that return 400 JSON). |

### Confirmed architecture / quality debt

| ID | Issue |
|----|-------|
| QUAL-01 | ~26 unused shadcn UI modules (accordion, carousel, toast stack unused because Sonner is used, etc.). |
| QUAL-02 | Duplicated date-range picker wiring between Overview and Transactions pages. |
| QUAL-03 | Large `date-range-picker.tsx` (~575 lines) with ESLint exhaustive-deps warnings. |
| QUAL-04 | Weak typing: `any` in History tooltip / TransactionTable emptyData & CSV export; `title: String` wrapper type in StatsCards. |
| QUAL-05 | Layout components inconsistently named `layout` vs `Layout`; manage page `page` vs `TransactionsPage`. |
| QUAL-06 | Unused `PiggyBank` import in `Logo.tsx`. |
| QUAL-07 | Scaffold `public/next.svg`, `vercel.svg` unused by app UI. |
| QUAL-08 | React Query Devtools shipped in production bundle path (always imported); package is also listed under **devDependencies** while imported from app code. |
| QUAL-09 | README / docs do not describe app, env vars, or scripts. |
| QUAL-10 | `SkeletonWrapper` keeps children mounted at `opacity-0` while loading — heavy charts/tables still construct. |
| QUAL-11 | Client components import runtime types from `app/api/.../route.ts` without consistent `import type` / shared types module (bundling smell). |
| QUAL-12 | `UpdateUserCurrency` lives under `app/wizard/_actions/` but is reused from Manage — organizational smell. |
| QUAL-13 | Some APIs return full Zod error objects/messages to clients (schema leakage); prefer stable error codes. |

---

## 7. Outdated or Deprecated Patterns

| Pattern | Location | Notes |
|---------|----------|-------|
| Next **14.2.3** (unpatched 14.2.x) | `package.json` | Multiple CVEs; upgrade ≥ **14.2.35** on 14.x |
| Clerk **v5** early (`5.0.3`) + bare `clerkMiddleware()` | `middleware.ts` | Current Clerk docs use `createRouteMatcher` + `auth.protect()` / `clerkMiddleware` callbacks |
| Middleware still named `middleware.ts` | root | Fine on Next 14; Next 16+ moves toward **proxy** naming — only relevant after major upgrade |
| No Pages Router leftovers | — | Good; pure App Router |
| `redirect()` for API auth failures | all `app/api/**` | Prefer HTTP 401 JSON for XHR/fetch clients |
| Side-effecting GET | `user-settings/route.ts` | REST anti-pattern |
| ESLint 8 + eslint-config-next 14.2.3 | tooling | Align with upgraded Next |
| Boilerplate README | `README.md` | Outdated relative to product |

**Not found:** `getServerSideProps`, `pages/`, `getInitialProps`, Pages API routes.

---

## 8. Performance and Security Findings

### 8.1 Performance (confirmed via `next build`)

| Route | Page size | First Load JS |
|-------|-----------|---------------|
| `/` | 112 kB | **426 kB** |
| `/manage` | 3.37 kB | **294 kB** |
| `/transactions` | 21.5 kB | **205 kB** |
| `/wizard` | 589 B | 162 kB |
| Shared | — | 87.3 kB |
| Middleware | 47.5 kB | — |

**Drivers:**

- Recharts imported statically in `History.tsx`.
- `@emoji-mart/react` + `@emoji-mart/data` in `CreateCategoryDialog.tsx` (pulled into manage / category flows).
- Large client subgraph from dashboard home importing dialogs + overview + history.
- No `next/dynamic` / lazy boundaries observed in app code.
- Default React Query refetch behavior (no `staleTime`).
- Browserslist/`caniuse-lite` outdated warning during build.

**Core Web Vitals (potential — not measured in RUM):**

- High JS on `/` likely pressures **TBT/INP** and mobile **LCP**.
- Dark-forced `html` class in root layout may flash vs `next-themes` system default (**FOUC**/theme mismatch potential).

### 8.2 Security (confirmed unless noted)

| Area | Finding | Severity |
|------|---------|----------|
| Next.js version | 14.2.3 affected by middleware auth bypass (fix ≥14.2.25), RSC DoS (fix ≥14.2.35), image cache, SSRF advisories, etc. | **Critical** |
| Middleware | `clerkMiddleware()` with no `protect` / public-route matcher | **High** |
| Client-only pages | `/manage`, `/transactions` lack RSC `currentUser` gate | **High** |
| API auth response | `redirect` instead of 401 | **Medium** |
| IDOR | Prisma queries generally filter `userId` — good | Positive |
| DeleteTransaction | Ownership check before mutate — good | Positive |
| Zod | Present on most writes; missing on delete transaction `id` | **Low–Medium** |
| Category type filter | Missing on create transaction lookup | **Medium** |
| Secrets | No secrets committed; Clerk/Postgres via env; no `NEXT_PUBLIC_` secrets in app source | Positive / verify Clerk keys in Vercel |
| Devtools | React Query Devtools in client provider | **Low–Medium** (info disclosure in prod) |
| npm audit | 30 vulns (2 critical, 22 high) — includes Next/Clerk trees | **High** |
| Error throwing | `stats/categories` **throws** on bad query vs JSON 400 | **Low** |
| CSRF | Next Server Actions have built-in origin checks — still keep Next patched | Note |

**Environment variables referenced in code / Prisma:**

| Name | Where | Purpose |
|------|-------|---------|
| `POSTGRES_PRISMA_URL` | `prisma/schema.prisma` | Pooled DB URL |
| `POSTGRES_URL_NON_POOLING` | `prisma/schema.prisma` | Direct URL |
| `NODE_ENV` | `lib/prisma.ts` | Dev singleton |

Clerk requires additional runtime env vars (typically `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and often sign-in/up URLs). **Exact names/values not present in repo** — pull via Vercel CLI (see §13).

---

## 9. Testing and Build Assessment

### Testing

| Area | Status |
|------|--------|
| Unit tests | **None** found |
| Integration tests | **None** |
| E2E (Playwright/Cypress) | **None** |
| Test scripts in `package.json` | **Missing** |
| CI (`.github/workflows`) | **Missing** |
| Coverage tooling | **None** |

**Missing critical cases (recommended later):** auth gating, wizard create/update currency, create/delete transaction aggregate integrity, category uniqueness, date-range validation (90-day max), API 401 behavior, IDOR attempts.

### Build / lint / types (executed this audit)

| Check | Result |
|-------|--------|
| `npm ci` | Success; postinstall `prisma generate` OK |
| `next lint` | Pass with **2 warnings** in `components/ui/date-range-picker.tsx` (react-hooks/exhaustive-deps) |
| `next build` | **Success**; all routes dynamic; browserslist outdated notice |
| Typecheck (via build) | Passed |
| `npm audit` | **30** vulnerabilities |
| CI readiness | **Not ready** — no workflow, no test/typecheck scripts, no `.env.example` |

### Scripts today

```json
"dev", "build", "start", "lint", "prisma-studio", "postinstall"
```

Missing useful scripts: `typecheck`, `test`, `test:e2e`, `db:migrate`, `analyze`.

---

## 10. Recommended Improvements

1. **Patch Next.js (and align eslint-config-next)** to latest secure 14.2.x (≥14.2.35) or plan Next 15 migration separately.
2. **Harden Clerk middleware** with public route matcher + `auth.protect()` for everything else; add server auth to dashboard layout.
3. **Fix API auth** to return `401` JSON; make client fetch helpers check status.
4. **Fix onboarding** — stop creating settings on GET; use explicit upsert on currency select; keep wizard gate meaningful.
5. **Filter categories by type** in `CreateTransaction`; add UUID validation on delete.
6. **Normalize React Query invalidation** and set sensible `staleTime`.
7. **Code-split** Recharts and emoji-mart; gate Devtools to `development`.
8. **Schema hygiene** — Decimal (or integer cents), indexes, `updatedAt`, optional FK strategy.
9. **Trim unused UI**, add `.env.example`, rewrite README.
10. **Add Vitest/Playwright + GitHub Actions** for lint/typecheck/build/test.

---

## 11. Risk Assessment

| Risk | Likelihood | Impact | Notes |
|------|------------|--------|-------|
| Exploitation of known Next CVEs | Medium–High (internet-facing) | High | Patch immediately |
| Unauthenticated UI shell for manage/transactions | High if middleware stays open | Medium–High | Data still gated by API if Clerk session required — verify runtime |
| Aggregate drift (history tables) | Medium on concurrent edits / partial failures | Medium | `$transaction` used but no reconciliation job |
| Float money errors | Medium over time | Medium | Accounting correctness |
| Onboarding auto-INR | High | Low–Medium | UX/data quality |
| No tests + no CI | High for regressions | High | Blocks safe modernization |
| Dependency vulns beyond Next | Medium | Variable | Many transitive; prioritize direct deps |

---

## 12. Missing Information / Manual Verification

| Item | Why |
|------|-----|
| Live Clerk dashboard config (redirect URLs, MFA, allowed origins) | Not in repo |
| Production env values | Pull with `vercel env pull` after `vercel link` |
| Whether deployment is Vercel-hosted (auto mitigations for some Next middleware CVEs) vs self-hosted | Affects exploitability notes |
| Real DB size / query latency | No production metrics |
| Actual Core Web Vitals (CrUX/RUM) | Build sizes only |
| Whether users rely on default INR creation | Product decision |
| Clerk package CVE applicability to locked `5.0.3` vs advisory ranges | Re-check after upgrade with `npm audit` |
| Prisma Accelerate / connection limits in prod | Only comments in schema |
| Bundle composition detail | Run `@next/bundle-analyzer` |

---

## 13. Prioritized Action Plan

### Issue register

| Issue ID | Module/File | Current Implementation | Problem | Recommendation | Priority | Impact | Effort | Dependencies |
|----------|-------------|------------------------|---------|-----------------|----------|--------|--------|--------------|
| SEC-01 | `package.json` (`next@14.2.3`) | Next 14.2.3 | Multiple known CVEs (middleware bypass, RSC DoS, etc.) | Upgrade to **≥14.2.35** (or current patched 14.2.x); bump `eslint-config-next` | Critical | Security | M | Regression test of auth + actions |
| SEC-02 | `middleware.ts` | `clerkMiddleware()` only | No route protection | Use `createRouteMatcher` for public `/sign-in`, `/sign-up`; `auth.protect()` elsewhere | Critical | Security | M | SEC-01 optional; Clerk docs |
| SEC-03 | `app/(dashboard)/layout.tsx`, manage/transactions pages | Layout has no auth; pages CSR-only | Unauthenticated users can load UI shell | Add server `currentUser()` (or auth()) check in dashboard layout | High | Security / UX | S | SEC-02 |
| SEC-04 | `app/api/**/route.ts` | `redirect("/sign-in")` when no user | Fetch clients mishandle redirects | Return `NextResponse.json({error}, {status:401})` | High | Security / Reliability | S | Client fetch helper |
| SEC-05 | Dependency tree | `npm audit` 30 vulns | Outdated Next/Clerk/transitive advisories | Upgrade Next + Clerk; re-run audit; avoid blind `--force` | High | Security | M | SEC-01 |
| BUG-01 | `app/api/user-settings/route.ts` | GET creates INR settings | Side-effect GET; skips intentional onboarding | Read-only GET; create via Server Action on currency confirm | High | UX / Maintainability | M | Wizard UX |
| BUG-02 | `app/(dashboard)/_actions/transactions.ts` | `findFirst` by name only | Wrong category type/icon possible | Include `type` in where clause | High | Correctness | S | None |
| BUG-03 | Create/Delete transaction clients | Partial query invalidation | Stale dashboard/table data | Invalidate `overview`, `history`, `transactions` consistently | High | UX | S | Query key convention |
| PERF-01 | `History.tsx`, `CreateCategoryDialog.tsx` | Static recharts/emoji-mart imports | Large First Load JS (426 kB on `/`) | `next/dynamic` + load emoji picker on open | High | Performance | M | None |
| PERF-02 | `components/providers/RootProviders.tsx` | Empty QueryClient; Devtools always on | Over-fetch; prod Devtools | `staleTime`; dynamic import Devtools for `development` only | Medium | Performance | S | None |
| API-01 | Client `fetch` call sites | No `res.ok` checks | Silent failures | Shared `apiGet` helper with error toast | High | Reliability / UX | M | SEC-04 |
| QUAL-01 | `CreateTransactionDialog.tsx` | No mutation `onError` | Stuck loading toast | Add onError toast | Medium | UX | S | None |
| QUAL-02 | `CategoriesStats.tsx` | `console.log` | Noise / minor leak | Remove | Low | Maintainability | S | None |
| DATA-01 | `prisma/schema.prisma` | `Float` amounts | Precision risk | Prefer `Decimal` or integer cents + migrate | Medium | Reliability | L | Migration plan |
| DATA-02 | `prisma/schema.prisma` | No indexes on Transaction userId/date | Slow history queries at scale | Add `@@index([userId, date])` | Medium | Performance | M | Migration |
| DATA-03 | `prisma/schema.prisma` | `updateAt` typo / unused | Misleading schema | Rename to `updatedAt` `@updatedAt` | Low | Maintainability | M | Migration |
| ARCH-01 | `manage/page.tsx`, `transactions/page.tsx` | Full-page client | Extra CSR, weaker auth placement | RSC shells + client islands | Medium | Maintainability / Perf | M | SEC-03 |
| ARCH-02 | Overview + Transactions | Duplicated date range logic | DRY violation | Shared `DateRangeControls` hook/component | Medium | Maintainability | S | None |
| ARCH-03 | `components/ui/*` | ~26 unused modules | Noise / install weight (mostly tree-shaken) | Remove unused shadcn files or document keep | Low | Maintainability | S | Confirm no dynamic imports |
| DX-01 | `README.md`, missing `.env.example` | Boilerplate README | Onboarding friction | Document stack, scripts, env vars | Medium | Maintainability | S | Env inventory |
| DX-02 | `package.json` scripts | No typecheck/test | Weak local/CI gates | Add `typecheck`, later `test` | Medium | Maintainability | S | None |
| TEST-01 | Repo root | No tests / CI | Regressions likely | Vitest for actions/schemas; Playwright smoke; GH Actions | High | Reliability | L | DX-02 |
| SEO-01 | `app/layout.tsx` only | Basic title/description | Weak social/SEO metadata | `metadataBase`, OG; route-level where public | Low | UX | S | Branding assets |
| CFG-01 | `next.config.mjs` | Empty | Missed headers/analyzer | Add security headers; optional bundle analyzer | Medium | Security / Perf | S | None |
| UX-01 | `app/layout.tsx` | `className="dark"` forced + system theme provider | Theme mismatch | Align default theme with forced class or remove force | Low | UX | S | Design decision |
| BUG-04 | `DeleteTransaction` | `id: string` unvalidated | Bad input → opaque errors | Zod UUID (or cuid) parse | Low | Security / Reliability | S | None |
| BUG-13 | `CurrencyComboBox.tsx` + dashboard consumers | Local toast success only | Currency formatters on `/` stay stale | Invalidate `userSettings` + refresh/revalidate dashboard settings | Medium | UX | S | BUG-01 |
| BUG-14 | `CreateCategoryDialog.tsx` | Controlled Popover missing `onOpenChange` | Picker dismiss buggy | Wire `onOpenChange={setIsOpenEmojiPicker}` | Medium | UX | S | None |
| BUG-15 | `CategoryPicker.tsx` | `useEffect` mirrors value to parent | Fragile sync / extra renders | Call `onChange` in `onSelect` | Low | Maintainability | S | None |
| BUG-16 | `app/api/stats/categories/route.ts` | `throw` on bad query | Inconsistent 500 vs 400 | Return `Response.json(..., { status: 400 })` like siblings | Medium | Reliability | S | SEC-04 |
| QUAL-10 | `SkeletonWrapper.tsx` | Children always mounted | Wasted work under skeleton | Conditionally render children or defer mount | Low | Performance | S | None |
| QUAL-12 | `app/wizard/_actions/userSettings.ts` | Wizard-scoped path used from Manage | Confusing module ownership | Move to shared `app/_actions` or `lib/actions` | Low | Maintainability | S | None |

### Phase plan

#### Phase 1 — Critical fixes and application stability

- SEC-01 Next upgrade  
- SEC-02 / SEC-03 Clerk middleware + dashboard layout auth  
- SEC-04 / API-01 API 401 + fetch helper  
- BUG-02 category type filter  
- BUG-03 / QUAL-01 query invalidation + mutation errors  
- SEC-05 re-audit dependencies after upgrades  

#### Phase 2 — Architecture and code quality

- BUG-01 onboarding/settings create path  
- BUG-13–BUG-16 currency invalidation, emoji popover, CategoryPicker effect, stats/categories 400  
- ARCH-01 RSC shells for manage/transactions  
- ARCH-02 shared date-range controls  
- QUAL-02/QUAL-10–QUAL-13 / ARCH-03 cleanup logs, skeleton mount, types, unused UI  
- DATA-03 schema naming cleanup  

#### Phase 3 — Next.js best practices and modernization

- loading.tsx / error.tsx for dashboard segments  
- Evaluate Server Components data fetching for initial overview (reduce client waterfalls)  
- Align Clerk to current v5/v6 recommended APIs  
- CFG-01 headers; SEO-01 metadata  
- Decide Next 15+ migration (separate plan; includes middleware→proxy considerations)  

#### Phase 4 — Performance and optimization

- PERF-01 dynamic import recharts & emoji-mart  
- PERF-02 React Query defaults; remove prod Devtools  
- DATA-02 indexes  
- Bundle analyzer pass; trim unused Radix deps if confirmed unused  
- Optional: Prisma accelerate / connection tuning (manual)  

#### Phase 5 — Testing and production readiness

- TEST-01 unit + E2E + CI  
- DX-01 / DX-02 docs and scripts  
- DATA-01 money type migration with backfill strategy  
- Production verification: `vercel link` + `vercel env pull`, Clerk dashboard review, CWV measurement  

---

## 14. Build Evidence Snapshot

Command: `npx next build` (2026-11-27), Next.js 14.2.3:

- Compiled successfully; type check passed.
- ESLint warnings only in `components/ui/date-range-picker.tsx` (hooks deps).
- All listed routes **dynamic (ƒ)**.
- Heaviest page: `/` at **426 kB** First Load JS.

---

## 15. Vercel CLI / Environment Pull Notes

Installed during this audit (host machine):

- **nvm** + **Node 20.20.2** (default) and Node 26.x available
- **Vercel CLI 67.0.0** via `npm install -g vercel`

Suggested next commands (manual — requires your Vercel login):

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

cd /Users/ajadhav/Desktop/coding/good_budget
vercel login
vercel link          # link to existing Vercel project
vercel env pull .env.local
```

Expected env groups (verify against Vercel project): Postgres URLs above + Clerk keys/URLs. Do not commit `.env.local`.

---

## 16. Appendix — Unused UI modules (confirmed unused outside `components/ui`)

`accordion`, `aspect-ratio`, `avatar`, `breadcrumb`, `carousel`, `checkbox`, `collapsible`, `context-menu`, `date-input`, `hover-card`, `input-otp`, `label` (only via form internals potentially — flag as verify), `menubar`, `navigation-menu`, `pagination`, `radio-group`, `resizable`, `slider`, `switch`, `textarea`, `toast`, `toaster`, `use-toast`, `toggle`, `toggle-group`, `tooltip`.

**Note:** `label` is imported by `components/ui/form.tsx`, which **is** used — keep `label.tsx`. Toast stack unused in favor of Sonner.

---

## 17. Appendix — Positive patterns to preserve

- Server Actions with `"use server"` + Zod `safeParse`
- `userId` scoping on mutations and deletes
- Aggregate history updates inside `prisma.$transaction`
- Path alias `@/*` and strict TypeScript
- Consistent feature folders (`_components`, `_actions`)
- Currency allowlist via Zod custom check against `lib/currencies.ts`
- Date range max (`MAX_DATE_RANGE_DAYS = 90`) enforced in schema and UI

---

*End of audit. No application source files were modified for this assessment other than adding this document. Dependencies were installed locally (`npm ci`) solely to run lint/build/audit verification.*
