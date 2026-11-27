# WP3 — Client Fetch Helper & Mutation Hygiene Report

**Date:** 27 November 2026  
**Work package:** WP3  
**Stack:** Next.js 14.2.35 · React 18 · TanStack Query 5 · Clerk 5.0.3  

Related: [`WP2_AUTHENTICATION_AUTHORIZATION_REPORT.md`](./WP2_AUTHENTICATION_AUTHORIZATION_REPORT.md) · [`EXECUTION_PLAN.md`](./EXECUTION_PLAN.md) · [`SECURITY_GUIDELINES.md`](../architecture/SECURITY_GUIDELINES.md)

---

## 1. Verdict

| Criterion | Result |
|-----------|--------|
| Shared `apiGet` with `res.ok` checks | **Yes** — [`lib/api.ts`](../../lib/api.ts) |
| All `/api/*` client queries use `apiGet` | **Yes** |
| Create/delete transaction invalidate overview + transactions | **Yes** |
| Create transaction has `onError` (no stuck loading toast) | **Yes** |
| Currency mutation invalidates `userSettings` + `router.refresh()` | **Yes** |
| API 401 JSON (server) | Already done in **WP2** (not reworked) |
| stats/categories 400 JSON (BUG-16) | Already done in **WP2** |
| Schema / formulas changed | **No** |
| WP3 ready for approval | **Yes** |

**Do not start WP4+** until explicitly approved. Note: WP4 (category `type` filter) was completed early in WP2.

---

## 2. Issues addressed

| Issue | Before | After |
|-------|--------|-------|
| API-01 / BUG-05 | `.then(res => res.json())` without `res.ok` | `apiGet` throws `ApiError` on non-OK |
| BUG-03 | Create invalidates only `overview`; delete only `transactions` | Both invalidate `overview` + `transactions` |
| QUAL-01 / BUG-04 | `CreateTransactionDialog` missing `onError` | Error toast replaces loading toast (`id: create-transaction`) |
| BUG-13 | Currency success did not invalidate / refresh RSC | Invalidates `["userSettings"]` + `router.refresh()` |
| SEC-04 | — | Confirmed already fixed in WP2 |
| BUG-16 | — | Confirmed already fixed in WP2 |

---

## 3. Implementation

### `lib/api.ts`

- `apiGet<T>(url)` — GET, parse JSON when present, throw `ApiError` with status + server `error` message when `!res.ok`.
- Safe for React Query `queryFn` (failed queries enter error state instead of treating HTML/error JSON as data).

### Query call sites updated

| File | Endpoint |
|------|----------|
| `StatsCards.tsx` | `/api/stats/balance` |
| `CategoriesStats.tsx` | `/api/stats/categories` |
| `History.tsx` | `/api/history-data` |
| `HistoryPeriodSelector.tsx` | `/api/history-periods` |
| `TransactionTable.tsx` | `/api/transactions-history` |
| `CategoryPicker.tsx` | `/api/categories` |
| `manage/page.tsx` | `/api/categories` |
| `CurrencyComboBox.tsx` | `/api/user-settings` |

### Mutations

| Component | Change |
|-----------|--------|
| `CreateTransactionDialog` | `onError` toast; invalidate `overview` + `transactions` |
| `DeleteTransactionDialog` | Invalidate `transactions` + `overview` |
| `CurrencyComboBox` | Invalidate `userSettings`; `router.refresh()` for RSC formatters |

Category create/delete already had `onError` + `categories` invalidation — left as-is.

---

## 4. Verification

| Check | Result |
|-------|--------|
| `npm run lint` | Pass (2 pre-existing date-picker warnings) |
| `npx tsc --noEmit` | Pass |
| `npm run build` | Pass |
| `npm test` | 6 passed |
| Raw `fetch('/api/...')` in app client code | **None** remaining |

Unauthenticated API **401** behavior was verified in WP2 / WP2 final verification; unchanged by this WP.

---

## 5. Residual / out of scope

1. React Query global `staleTime` / Devtools gating → **WP8**.  
2. Onboarding create-on-GET → **WP5**.  
3. Clerk `5.7.6+` advisory patch → follow-up (not WP3).  
4. Live dual-user IDOR → still unverified.  
5. Dashboard currency formatters still depend on RSC refresh after currency change (now triggered).

---

## 6. Files touched

| Path | Role |
|------|------|
| `lib/api.ts` | **New** shared GET helper |
| `app/(dashboard)/_components/StatsCards.tsx` | apiGet |
| `app/(dashboard)/_components/CategoriesStats.tsx` | apiGet |
| `app/(dashboard)/_components/History.tsx` | apiGet + typed query |
| `app/(dashboard)/_components/HistoryPeriodSelector.tsx` | apiGet |
| `app/(dashboard)/_components/CategoryPicker.tsx` | apiGet |
| `app/(dashboard)/_components/CreateTransactionDialog.tsx` | onError + invalidation |
| `app/(dashboard)/transactions/_components/TransactionTable.tsx` | apiGet |
| `app/(dashboard)/transactions/_components/DeleteTransactionDialog.tsx` | invalidation |
| `app/(dashboard)/manage/page.tsx` | apiGet |
| `components/common/CurrencyComboBox.tsx` | apiGet + invalidate + refresh |
| Docs listed in §7 | Status updates |

---

## 7. Documentation updates

- This report  
- `docs/modernization/EXECUTION_PLAN.md`  
- `docs/modernization/MODERNIZATION_ROADMAP.md`  
- `docs/architecture/CODING_STANDARDS.md` (fetch helper note)  
- `docs/architecture/APPLICATION_ARCHITECTURE.md` (client reads path)

---

## 8. Completion checklist

- [x] Shared `apiGet`  
- [x] All client API GETs migrated  
- [x] Transaction create/delete invalidation  
- [x] Create transaction `onError`  
- [x] Currency invalidation + RSC refresh  
- [x] lint / tsc / build / tests  
- [x] Docs updated  
- [x] No Next 16 / no Prisma migrations  
