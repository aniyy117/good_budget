# Execution Plan

Ordered work packages for GoodBudget modernization. Execute phases in order unless a later item is explicitly pulled forward for safety.

Related: [`MODERNIZATION_ROADMAP.md`](./MODERNIZATION_ROADMAP.md) · [Audit issue register](../audit/NEXTJS_APPLICATION_AUDIT.md)

---

## Global rules

1. One work package per PR when practical.
2. Verify with `npm run lint` and `npm run build` before merge.
3. Update roadmap status when a package completes.
4. No schema migrations in production without backup (see DB plan).
5. Read [`AGENTS.md`](../../AGENTS.md) before coding.

---

## WP0 — Documentation foundation

| | |
|--|--|
| **Status** | Completed (AI docs system) |
| **Deliverables** | `AGENTS.md`, `docs/**`, Cursor/Claude stubs, README |
| **Exit** | Agents can navigate standards without re-auditing from scratch |

---

## Phase 0 — Preparation & baseline verification

| | |
|--|--|
| **Status** | **Completed** (27 November 2026) — see [`PHASE_0_BASELINE_REPORT.md`](./PHASE_0_BASELINE_REPORT.md) |
| **Deliverables** | Git baseline noted; lint/tsc/build executed; npm audit; Prisma read connectivity; unauthenticated HTTP probes; backup/restore procedure documented |
| **Exit** | Evidence-based baseline for Phase 1; known security gaps documented (not fixed) |
| **Conditions before WP1** | Commit or stash dirty docs tree; optional local tag `backup/pre-phase1-*`; take DB snapshot before any later schema WP |

### Phase 0 measured highlights

- `lint` exit 0 (2 warnings); `tsc --noEmit` exit 0; `build` exit 0 on Next **14.2.3**
- `/` First Load JS **426 kB**; npm audit **30** vulns (2 critical)
- Unauthenticated: `/transactions` + `/manage` → **200**; `/` + `/wizard` → **307** `/sign-in`
- DB connected: 9 settings, 189 transactions, 15 categories (counts only)
- Hosting: **Vercel** project `good-budget` linked

---

## WP1 — Patch Next 14.2.x (security floor)

| | |
|--|--|
| **Status** | **Completed** (27 November 2026) — see [`WP1_NEXTJS_SECURITY_UPGRADE_REPORT.md`](./WP1_NEXTJS_SECURITY_UPGRADE_REPORT.md) |
| **Files** | `package.json`, `package-lock.json` (+ docs) |
| **Actions** | Bumped `next` and `eslint-config-next` to **14.2.35** (exact); React 18.3.1 unchanged; lint/tsc/build/prisma/HTTP smoke verified |
| **Risks** | Residual `npm audit` findings on `next` require leaving 14.2 (Phase 3); auth gaps unchanged (WP2) |
| **Exit** | Met: builds on 14.2.35; route behavior matches Phase 0 baseline |
| **Audit** | SEC-01 partially addressed on 14.2 line; SEC-05 / Clerk / remaining Next CVEs still open |

---

## WP2 — Clerk route protection + dashboard auth

| | |
|--|--|
| **Status** | **Completed** (27 November 2026) — see [`WP2_AUTHENTICATION_AUTHORIZATION_REPORT.md`](./WP2_AUTHENTICATION_AUTHORIZATION_REPORT.md) |
| **Files** | `middleware.ts`, `lib/auth.ts`, dashboard/wizard layouts, all `app/api/**`, Server Actions, Vitest security tests |
| **Actions** | Public matcher; page `redirectToSignIn`; layout `requirePageAuth`; API **401** JSON; action `requireActionUser`; category `type` filter; UUID delete validation |
| **Exit** | Met: unauthenticated `/transactions`/`/manage` → 307 sign-in; APIs → 401 JSON; lint/tsc/build + 6 Vitest tests pass |
| **Audit** | SEC-02, SEC-03, SEC-04 addressed; BUG-02 addressed early |

---

## WP3 — API 401 + fetch helper + mutation hygiene

| | |
|--|--|
| **Status** | **Completed** (27 November 2026) — see [`WP3_CLIENT_FETCH_MUTATION_HYGIENE_REPORT.md`](./WP3_CLIENT_FETCH_MUTATION_HYGIENE_REPORT.md) |
| **Files** | `lib/api.ts`; client query `queryFn`s; create/delete transaction dialogs; `CurrencyComboBox` |
| **Actions** | Shared `apiGet` (res.ok); invalidate `overview` + `transactions` on create/delete; create `onError`; currency invalidate + `router.refresh()`; API 401 / BUG-16 already from WP2 |
| **Exit** | Met: no raw client `/api` fetch; failed create toast replaces loading; cross-view invalidation |
| **Audit** | API-01, BUG-03, BUG-04/QUAL-01, BUG-13 addressed; SEC-04 + BUG-16 confirmed via WP2 |

---

## WP4 — Transaction category type filter

| | |
|--|--|
| **Status** | **Completed early in WP2** (no further code required) |
| **Files** | `app/(dashboard)/_actions/transactions.ts` |
| **Actions** | Include `type` in category `findFirst` |
| **Exit** | Met in WP2 — income/expense categories cannot cross-attach |
| **Audit** | BUG-02 |

---

## WP5 — Onboarding settings create path

| | |
|--|--|
| **Status** | **Completed** (27 November 2026) — see [`WP5_ONBOARDING_SETTINGS_REPORT.md`](./WP5_ONBOARDING_SETTINGS_REPORT.md) |
| **Files** | `app/api/user-settings/route.ts`, `app/wizard/_actions/userSettings.ts`, `CurrencyComboBox.tsx`, `app/wizard/page.tsx` |
| **Actions** | GET read-only (`null` if missing); `UpdateUserCurrency` upsert + revalidate; wizard copy fix |
| **Exit** | Met: visiting wizard alone does not create settings; currency select creates/updates row |
| **Audit** | BUG-01, BUG-11 addressed; BUG-12 copy fixed opportunistically |

---

## WP-MC — Multi-currency transactions (pulled forward)

| | |
|--|--|
| **Status** | **Completed** (27 November 2026) — see [`WP_MULTI_CURRENCY_REPORT.md`](./WP_MULTI_CURRENCY_REPORT.md) |
| **Files** | Prisma migration, `lib/fx.ts`, create/delete actions, create dialog, transactions history API/table, `CurrencyComboBox` |
| **Actions** | Snapshot FX at write; history uses `amountInBase`; dual display; base-change warning; no historical rebase |
| **Exit** | Met: original + base fields; Frankfurter FX fail-closed; UI currency + ≈ base line; manage warns on base change |
| **Spec** | [`docs/superpowers/specs/2026-11-27-multi-currency-design.md`](../superpowers/specs/2026-11-27-multi-currency-design.md) |
| **Non-goals** | Float→Decimal (WP12); rebase on base change |

---

## WP6 — RSC shells for manage & transactions

| | |
|--|--|
| **Status** | **Completed** (27 November 2026) — see [`WP6_RSC_SHELLS_REPORT.md`](./WP6_RSC_SHELLS_REPORT.md) |
| **Files** | `manage/page.tsx`, `manage/_components/ManagePageContent.tsx`, `transactions/page.tsx`, `transactions/_components/TransactionsPageContent.tsx` |
| **Actions** | RSC page shells; currency/categories + date-range/table as client islands |
| **Exit** | Met: static headers/titles server-rendered; interactivity isolated |
| **Audit** | ARCH-01 |

---

## WP7 — UX bugfixes (picker / popover / DRY date range)

| | |
|--|--|
| **Status** | **Completed** (27 November 2026) — see [`WP7_UX_BUGFIXES_REPORT.md`](./WP7_UX_BUGFIXES_REPORT.md) |
| **Files** | `CreateCategoryDialog.tsx`, `CategoryPicker.tsx`, `hooks/use-date-range-filter.ts`, Overview + TransactionsPageContent |
| **Actions** | Popover `onOpenChange`; CategoryPicker select→onChange; shared date-range hook |
| **Exit** | Met: emoji dismiss works; picker sync clean; DRY date-range validation |
| **Audit** | BUG-14, BUG-15, ARCH-02 |

---

## WP8 — Performance: dynamic imports + RQ defaults

| | |
|--|--|
| **Status** | **Completed** (27 November 2026) — see [`WP8_PERFORMANCE_REPORT.md`](./WP8_PERFORMANCE_REPORT.md) |
| **Files** | `History.tsx`, `HistoryChart.tsx`, `EmojiPickerPanel.tsx`, `CreateCategoryDialog.tsx`, `RootProviders.tsx` |
| **Actions** | Dynamic recharts + lazy emoji-mart; RQ `staleTime` 60s; Devtools development-only |
| **Exit** | Met: `/` First Load JS **426 kB → 221 kB**; Devtools gated |
| **Audit** | PERF-01, PERF-02 |

---

## WP9 — Database indexes (+ optional naming)

| | |
|--|--|
| **Status** | **Completed** (27 November 2026) — see [`WP9_DB_INDEXES_REPORT.md`](./WP9_DB_INDEXES_REPORT.md) |
| **Files** | `prisma/schema.prisma`, `prisma/migrations/20261127111659_transaction_user_date_index/` |
| **Actions** | Approach A: `@@index([userId, date])` only; `updateAt` rename deferred (DATA-03) |
| **Exit** | Schema + migration committed in tree; apply with `prisma migrate deploy` when DB reachable |
| **Audit** | DATA-02 (DATA-03 deferred) |
| **Depends** | Backup procedure in [`DATABASE_MIGRATION_PLAN.md`](./DATABASE_MIGRATION_PLAN.md) |

---

## WP10 — Next.js 16 + React 19 + Clerk bump

| | |
|--|--|
| **Status** | Pending |
| **Depends** | WP1–WP4 strongly recommended first |
| **Actions** | Follow Next upgrade guide; bump Clerk; fix breakages; update TECH_STACK + AGENTS “current” versions |
| **Exit** | `next build` green on Next 16; smoke E2E |
| **See** | [`DEPENDENCY_COMPATIBILITY_REPORT.md`](./DEPENDENCY_COMPATIBILITY_REPORT.md) |

---

## WP11 — Tests + CI

| | |
|--|--|
| **Status** | Pending |
| **Actions** | Vitest schemas/actions; Playwright smoke; GitHub Actions |
| **Exit** | CI required on PRs |
| **See** | [`TESTING_STRATEGY.md`](../architecture/TESTING_STRATEGY.md) |

---

## WP12 — Money type migration

| | |
|--|--|
| **Status** | Pending |
| **Depends** | Explicit product decision (Decimal vs integer cents) + backups |
| **See** | [`DATABASE_MIGRATION_PLAN.md`](./DATABASE_MIGRATION_PLAN.md) |

---

## Verification commands (every code WP)

```bash
npm run lint
npm run build
```

Optional when available: `npm run typecheck`, `npm test`, `npm run test:e2e`.
