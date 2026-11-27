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
| **Status** | Pending |
| **Files** | `middleware.ts`, `app/(dashboard)/layout.tsx` |
| **Actions** | Public matcher for sign-in/up; `auth.protect()` elsewhere; server gate in dashboard layout |
| **Exit** | Unauthenticated users cannot use dashboard HTML or APIs |
| **Audit** | SEC-02, SEC-03 |

---

## WP3 — API 401 + fetch helper + mutation hygiene

| | |
|--|--|
| **Status** | Pending |
| **Files** | All `app/api/**/route.ts`; client query `queryFn`s; create/delete dialogs |
| **Actions** | Replace auth `redirect` with 401 JSON; shared `apiGet`; invalidate overview/transactions/history/userSettings; add `onError` |
| **Exit** | Failed auth/mutations show toasts; no stuck loading toasts |
| **Audit** | SEC-04, API-01, BUG-03, QUAL-01, BUG-13, BUG-16 |

---

## WP4 — Transaction category type filter

| | |
|--|--|
| **Status** | Pending |
| **Files** | `app/(dashboard)/_actions/transactions.ts` |
| **Actions** | Include `type` in category `findFirst` |
| **Exit** | Income/expense categories cannot cross-attach |
| **Audit** | BUG-02 |

---

## WP5 — Onboarding settings create path

| | |
|--|--|
| **Status** | Pending |
| **Files** | `app/api/user-settings/route.ts`, `app/wizard/_actions/userSettings.ts`, `CurrencyComboBox.tsx` |
| **Actions** | GET read-only; create/upsert via Server Action on currency select; keep dashboard redirect meaningful |
| **Exit** | Visiting wizard alone does not silently complete onboarding |
| **Audit** | BUG-01, BUG-11 |

---

## WP6 — RSC shells for manage & transactions

| | |
|--|--|
| **Status** | Pending |
| **Files** | `app/(dashboard)/manage/page.tsx`, `transactions/page.tsx`, extract client islands |
| **Exit** | Static headers server-rendered; interactivity isolated |
| **Audit** | ARCH-01 |

---

## WP7 — UX bugfixes (picker / popover / DRY date range)

| | |
|--|--|
| **Status** | Pending |
| **Files** | `CreateCategoryDialog.tsx`, `CategoryPicker.tsx`, Overview + Transactions date range |
| **Exit** | Emoji popover dismiss works; CategoryPicker sync clean; shared date-range helper |
| **Audit** | BUG-14, BUG-15, ARCH-02 |

---

## WP8 — Performance: dynamic imports + RQ defaults

| | |
|--|--|
| **Status** | Pending |
| **Files** | `History.tsx`, `CreateCategoryDialog.tsx`, `RootProviders.tsx` |
| **Exit** | Lower First Load JS on `/`; Devtools only in development |
| **Audit** | PERF-01, PERF-02 |

---

## WP9 — Database indexes (+ optional naming)

| | |
|--|--|
| **Status** | Pending |
| **Files** | `prisma/schema.prisma`, migration |
| **Actions** | `@@index([userId, date])` on Transaction; optional `updatedAt` rename |
| **Exit** | Migration applied to staging; explain plans improved |
| **Audit** | DATA-02, DATA-03 |
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
