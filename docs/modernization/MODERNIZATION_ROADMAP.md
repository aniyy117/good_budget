# Modernization Roadmap

**Product goal:** Phased modernization of GoodBudget toward **Next.js 16** without rewriting the product or compromising auth, UX, or financial data.

**Last updated:** 27 November 2026 (WP3 client fetch / mutation hygiene completed)

Related: [`EXECUTION_PLAN.md`](./EXECUTION_PLAN.md) · [`PHASE_0_BASELINE_REPORT.md`](./PHASE_0_BASELINE_REPORT.md) · [Audit](../audit/NEXTJS_APPLICATION_AUDIT.md) · [`AGENTS.md`](../../AGENTS.md)

---

## Status legend

| Status | Meaning |
|--------|---------|
| Completed | Done and verified |
| In progress | Actively underway |
| Pending | Not started |
| Blocked | Waiting on decision or dependency |

---

## Foundation

| Work | Status |
|------|--------|
| Technical audit | **Completed** — [`docs/audit/NEXTJS_APPLICATION_AUDIT.md`](../audit/NEXTJS_APPLICATION_AUDIT.md) |
| AI instruction system (`AGENTS.md` + `docs/`) | **Completed** (this documentation set) |
| Phase 0 preparation & baseline verification | **Completed** — [`PHASE_0_BASELINE_REPORT.md`](./PHASE_0_BASELINE_REPORT.md) |
| Application code upgrades | **Pending** |

---

## Phase 1 — Critical fixes and application stability

**Goal:** Security patching path + auth hardening + correctness blockers.

| Item | Audit IDs | Status |
|------|-----------|--------|
| Upgrade Next off 14.2.3 (prefer ≥14.2.35 on 14.x first) | SEC-01, SEC-05 | **Completed** — now **14.2.35** ([WP1 report](./WP1_NEXTJS_SECURITY_UPGRADE_REPORT.md)); residual Next advisories need major upgrade later |
| Clerk middleware route protection | SEC-02 | **Completed** (WP2) |
| Dashboard layout / manage & transactions auth gates | SEC-03 | **Completed** (WP2) |
| API 401 JSON + client fetch helper | SEC-04, API-01 | **Completed** — API 401 (WP2); `apiGet` + mutations ([WP3 report](./WP3_CLIENT_FETCH_MUTATION_HYGIENE_REPORT.md)) |
| Category lookup includes `type` | BUG-02 | **Completed** (WP2) |
| Query invalidation + mutation `onError` | BUG-03, QUAL-01 | **Completed** (WP3); currency invalidation BUG-13 also WP3 |

**Exit criteria:** Authenticated-only dashboard; APIs fail closed with JSON; critical transaction correctness fixed; Next on a patched release (14.2.x floor or later).

---

## Phase 2 — Architecture and code quality

| Item | Audit IDs | Status |
|------|-----------|--------|
| Fix onboarding settings create (no GET side effect) | BUG-01, BUG-11 | Pending (BUG-13 currency invalidation done in WP3) |
| RSC shells for manage/transactions | ARCH-01 | Pending |
| Shared date-range controls | ARCH-02 | Pending |
| Emoji popover / CategoryPicker / stats 400 consistency | BUG-14–16 | **Partial** — BUG-16 done (WP2); BUG-14/15 pending |
| Cleanup logs, unused UI, action organization | QUAL-* | Pending |
| Schema naming (`updatedAt`) | DATA-03 | Pending |

**Exit criteria:** Clear RSC/client boundaries; onboarding intentional; no known UX bugs from Phase 2 list.

---

## Phase 3 — Next.js best practices and Next 16 modernization

| Item | Status |
|------|--------|
| `loading.tsx` / `error.tsx` for dashboard | Pending |
| Reduce client waterfalls (server prefetch where useful) | Pending |
| Clerk upgrade to version supporting Next 16 / React 19 | Pending |
| Next.js **16** + React **19** migration | Pending |
| Adapt middleware → proxy (if required by Next 16) | Pending |
| Metadata / security headers | Pending |

**Exit criteria:** App runs on Next 16 with green lint/build and smoke E2E; docs updated to mark Next 16 as **current**.

**Note:** Direct 14.2.3 → 16 is high risk. Prefer patched 14.2.x (and optionally 15) before 16. See [`DEPENDENCY_COMPATIBILITY_REPORT.md`](./DEPENDENCY_COMPATIBILITY_REPORT.md).

---

## Phase 4 — Performance and optimization

| Item | Audit IDs | Status |
|------|-----------|--------|
| Dynamic import recharts + emoji-mart | PERF-01 | Pending |
| React Query defaults; Devtools dev-only | PERF-02 | Pending |
| DB indexes on Transaction | DATA-02 | Pending |
| Bundle analyzer pass | — | Pending |

**Exit criteria:** Measurable First Load JS reduction on `/`; indexes applied in non-prod then prod.

---

## Phase 5 — Testing and production readiness

| Item | Status |
|------|--------|
| Vitest + critical unit/integration tests | Pending |
| Playwright smoke E2E | Pending |
| CI workflow | Pending |
| README / `.env.example` (names only) | Pending (README partially updated with docs system) |
| Money type migration execution | Pending — plan in [`DATABASE_MIGRATION_PLAN.md`](./DATABASE_MIGRATION_PLAN.md) |

**Exit criteria:** CI green on main; E2E smoke passes; ops docs sufficient for a new engineer/agent.

---

## Out of scope (unless explicitly requested)

- Full UI redesign / rebrand
- Mobile native apps
- Multi-currency transactions per row
- Replacing Clerk or Prisma
