# WP1 — Next.js Security Patch Upgrade Report

**Date:** 27 November 2026  
**Work package:** WP1 (Phase 1 security floor)  
**Scope:** Upgrade Next.js **14.2.3 → 14.2.35** (latest 14.2.x). **No** Next.js 16 migration.  
**Restrictions honored:** No Prisma schema/migrations, no financial logic changes, no app redesign, no force audit fixes, no push/history rewrite.

Related: [`PHASE_0_BASELINE_REPORT.md`](./PHASE_0_BASELINE_REPORT.md) · [`EXECUTION_PLAN.md`](./EXECUTION_PLAN.md) · [`DEPENDENCY_COMPATIBILITY_REPORT.md`](./DEPENDENCY_COMPATIBILITY_REPORT.md)

---

## 1. Verdict

| Criterion | Result |
|-----------|--------|
| Next.js on verified patched **14.2.x ≥ 14.2.35** | **Yes — 14.2.35** |
| React preserved on 18.x | **Yes — 18.3.1** |
| `lint` / `tsc` / `build` | **Pass** (lint: 2 pre-existing warnings) |
| Prisma validate + DB read | **Pass** |
| Route smoke vs Phase 0 | **Equivalent** |
| Schema / financial data changed | **No** |
| Application fully secured by this upgrade alone | **No** — residual Next advisories (need newer major) + auth gaps (WP2) remain |

**WP1 ready for approval:** **Yes**, as the approved intermediate security floor on the 14.2 line.

**Do not start WP2 or Next 16** until explicitly approved.

---

## 2. Pre-implementation

| Check | Result |
|-------|--------|
| Branch | `main` @ `9ba4276` (aligned with `origin/main`) |
| Dirty docs tree | Stashed as `phase0-docs-pre-wp1`, then restored after upgrade |
| Recovery | Local branch/tag `backup/pre-wp1-2026-11-27` at pre-upgrade HEAD |
| Target version | **14.2.35** = latest `14.2.x` on npm; official Dec 2025 security floor for 14.x ([Next.js Security Update](https://nextjs.org/blog/security-update-2025-12-11)) |
| Node | 20.20.2 — compatible |
| Unexpected app source changes | None |

---

## 3. Dependency changes

### Before → after

| Package | Before | After | Reason |
|---------|--------|-------|--------|
| `next` | 14.2.3 | **14.2.35** | Security patch to latest 14.2.x |
| `eslint-config-next` | 14.2.3 | **14.2.35** | Keep ESLint config aligned with Next |
| `react` / `react-dom` | 18.3.1 | **18.3.1** (unchanged) | Compatible; no requirement to bump |
| `@clerk/nextjs` | 5.0.3 | unchanged | Out of WP1 scope |
| `@prisma/client` | 5.13.0 | unchanged | Out of WP1 scope |

### Transitive (via lockfile, expected)

- `@next/env`, `@next/eslint-plugin-next` → **14.2.35**
- Other Next internal packages updated as required by `next@14.2.35`

**Not done:** `npm audit fix --force`, React 19, Next 15/16, Clerk major, Prisma major.

**Command used:**

```bash
npm install next@14.2.35 eslint-config-next@14.2.35 --save-exact
```

---

## 4. Security improvements vs Phase 0

### Addressed by moving 14.2.3 → 14.2.35 (cumulative 14.2 patches)

Includes fixes published on the 14.2 line up through 14.2.35, notably:

- Middleware authorization bypass class issues patched in earlier 14.2.x (e.g. ≥14.2.25) — now included
- RSC / Server Components DoS incomplete-fix follow-up (**CVE-2025-67779** / GHSA-5j59-xgg2-r9c4) — fixed in **14.2.35**
- Intermediate 14.2.x fixes (image cache, SSRF middleware redirects, etc. as applicable to versions &lt; 14.2.35)

### `npm audit` comparison

| Metric | Phase 0 (14.2.3) | WP1 (14.2.35) |
|--------|------------------|---------------|
| Total | 30 | **28** |
| Critical | 2 | **2** |
| High | 22 | **20** |
| Moderate | 5 | 5 |
| Low | 1 | 1 |

**Critical packages still listed:** `next`, `@clerk/nextjs` tree.

### Remaining `next` advisories (honest)

`npm audit` still reports **`next` as critical** at 14.2.35 because **later advisories (2026)** are fixed only on **15.5.x / 16.x** lines, not on 14.2. Examples still flagged against the installed range include Image Optimizer RCE classes, additional Server Action DoS, request smuggling for certain self-hosted setups, etc.

**Interpretation for GoodBudget:**

- WP1 **completed the approved 14.2 security floor**.
- **Eliminating remaining `next` audit findings requires leaving 14.2** (Phase 3 / Next 15.5+ or 16) — **out of WP1 scope**.
- App is **Vercel-linked**; some self-hosted-only advisories are lower practical risk on Vercel, but this is **not** a substitute for future upgrades.
- **Clerk** critical/high findings unchanged — separate upgrade (WP10 / Clerk bump).

### Auth gaps unchanged (require WP2+)

- Bare `clerkMiddleware()` without `protect`
- `/manage` and `/transactions` still return **200** unauthenticated
- APIs still **307** redirect instead of 401 JSON

**Upgrading Next.js alone does not secure the application.**

---

## 5. Regression verification (executed)

| Check | Result | vs Phase 0 |
|-------|--------|------------|
| `npm run lint` | exit **0**; 2 warnings in `date-range-picker.tsx` | Same warnings |
| `npx tsc --noEmit` | exit **0** | Same |
| `npm run build` | exit **0**; Next **14.2.35** | Pass |
| `npx prisma validate` | Pass | Same |
| DB `SELECT 1` + txn count | connected; **189** transactions | Same scale |
| HTTP `/sign-in`, `/sign-up` | 200 | Same |
| HTTP `/`, `/wizard` | 307 → `/sign-in` | Same |
| HTTP `/transactions`, `/manage` | 200 (unauth) | Same gap |
| HTTP `/api/categories` | 307 → `/sign-in` | Same |

### Build sizes (measured after upgrade)

| Route | First Load JS |
|-------|---------------|
| `/` | **426 kB** (page 111 kB) |
| `/manage` | 294 kB |
| `/transactions` | 205 kB |
| Shared | 87.5 kB |
| Middleware | 47.1 kB |

Essentially unchanged vs Phase 0 (~426 kB `/`).

### Not executed

- Authenticated Clerk UI click-through
- Creating/deleting transactions in browser
- Lighthouse

---

## 6. Files modified

| File | Change |
|------|--------|
| `package.json` | `next` and `eslint-config-next` pinned to `14.2.35` |
| `package-lock.json` | Lockfile updated for the above |
| `docs/modernization/WP1_NEXTJS_SECURITY_UPGRADE_REPORT.md` | This report |
| `docs/modernization/EXECUTION_PLAN.md` | WP1 status |
| `docs/modernization/DEPENDENCY_COMPATIBILITY_REPORT.md` | Stage A marked done |
| `docs/modernization/MIGRATION_RISK_ASSESSMENT.md` | R1 / WP1 notes |
| `docs/modernization/MODERNIZATION_ROADMAP.md` | Phase 1 Next patch status |
| `docs/architecture/TECH_STACK.md` | Current Next version |
| `AGENTS.md` | Current Next version in stack table |

**Not modified:** `app/`, `components/`, `prisma/schema.prisma`, env files, Clerk config, financial logic.

---

## 7. Rollback instructions

```bash
# From repo root — restore pre-WP1 package versions from backup tip
git checkout backup/pre-wp1-2026-11-27 -- package.json package-lock.json
npm ci
npm run build
```

Or manually:

```bash
npm install next@14.2.3 eslint-config-next@14.2.3 --save-exact
```

Local tag/branch: `backup/pre-wp1-2026-11-27` (points at pre-upgrade commit `9ba4276`; re-apply docs separately if needed).

---

## 8. Remaining issues / next work (not started)

1. **WP2** — Clerk middleware protect + dashboard auth gates  
2. **WP3+** — API 401s, category type filter, etc.  
3. **Later major Next upgrade** — required to clear residual `npm audit` Next findings beyond 14.2.35  
4. **Clerk dependency advisories** — unchanged  
5. Commit docs + WP1 dependency bump when ready (not pushed in this WP)

---

## 9. Completion checklist

- [x] Next.js **14.2.35**
- [x] Dependency compatibility confirmed (React 18 retained)
- [x] Production build passes
- [x] TypeScript passes
- [x] Lint documented
- [x] Security compared to Phase 0 baseline
- [x] No DB schema / financial data changes
- [x] Documentation updated
