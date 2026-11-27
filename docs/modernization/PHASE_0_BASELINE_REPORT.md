# Phase 0 — Baseline Verification Report

**Date:** 27 November 2026  
**Executor:** AI agent (read-only verification; documentation updates only)  
**Scope:** Preparation and baseline before Next.js 16 modernization  
**Restrictions honored:** No dependency upgrades, no app source changes, no Prisma migrations, no secret disclosure  

Related: [`AGENTS.md`](../../AGENTS.md) · [`EXECUTION_PLAN.md`](./EXECUTION_PLAN.md) · [`MODERNIZATION_ROADMAP.md`](./MODERNIZATION_ROADMAP.md) · [Audit](../audit/NEXTJS_APPLICATION_AUDIT.md)

---

## 1. Executive verdict

| Question | Answer |
|----------|--------|
| Can Phase 1 (Next 14.2.x security patch) start after docs commit? | **Yes, with conditions** |
| Is Phase 0 fully “green / no blockers”? | **No** — critical security debt remains **documented**, not fixed (by design) |
| Ready for Next.js **16** jump? | **No** — complete Phase 1–2 / staged upgrades first |
| Audit still accurate? | **Yes** on core findings; re-verified against repo + live HTTP probes |

**Phase 0 approval recommendation:** Approve Phase 0 as **complete for preparation**, with explicit acknowledgment that **SEC-01 (Next 14.2.3 CVEs)** and **unauthenticated `/manage` + `/transactions` shells** are **known blockers for production hardening**, deferred to Phase 1 (not fixed in Phase 0).

---

## 2. Environment and repository baseline

| Item | Result |
|------|--------|
| Branch | `main` |
| HEAD (committed) | `9ba4276774e876b404fc0ca0c7b7aafbdae2062c` — `worked on bug fixes` |
| Upstream | `origin/main` — **in sync** (0 ahead / 0 behind) |
| Working tree | **Dirty** — documentation / AI instruction system not committed |
| Tags | None |
| Stash | Empty |
| Node | **v20.20.2** (nvm) |
| npm | **10.8.2** |
| `node_modules` | Present |
| `.env.local` | Present (values not recorded) |
| `.vercel` | Present — project linked as **`good-budget`** (Vercel) |
| Hosting | **Resolved:** Vercel-linked (`/.vercel/repo.json`); production deploy assumed Vercel unless proven otherwise |

### Uncommitted changes (preserved; not discarded)

| Path | State |
|------|--------|
| `.gitignore` | Modified (adds `.env*`) |
| `README.md` | Modified |
| `AGENTS.md`, `CLAUDE.md`, `NEXTJS_APPLICATION_AUDIT.md` (stub), `docs/`, `.cursor/` | Untracked |

**Recoverable Git baseline:** Yes — committed tip `9ba4276` on `origin/main` is recoverable. Local docs work is **not** protected by remote until committed.

---

## 3. Git backup and recovery steps (required)

### Application / Git

1. **Do not** `git reset --hard`, `git clean -fd`, or force-push.
2. Before Phase 1 code changes, **commit or stash** the documentation working tree so it is not mixed with upgrade diffs:
   - Preferred: commit docs on `main` or a `docs/phase-0` branch.
   - Alternative: `git stash push -u -m "phase0-docs"` (includes untracked).
3. Create a named recovery point before upgrades:
   ```bash
   git branch backup/pre-phase1-2026-11-27
   git tag backup/pre-phase1-2026-11-27   # optional local tag
   ```
4. Rollback app code: `git switch main` / `git reset --hard backup/pre-phase1-2026-11-27` **only with explicit user approval** (destructive to uncommitted work).

### Database backup / restore (Vercel Postgres / Neon-style)

**Current state:** No in-repo backup scripts. Provider backups are the primary recovery path. Live DB **read** connectivity was verified (see §8).

**Create backup (recommended before any migration):**

1. Vercel Dashboard → Storage / Postgres → enable **PITR** if available; create a manual snapshot if the UI offers it.
2. Or logical dump using the **non-pooling** URL (from local env; do not commit):
   ```bash
   # Load env privately; do not echo URLs
   pg_dump "$POSTGRES_URL_NON_POOLING" --format=custom --file="good_budget_$(date +%Y%m%d).dump"
   ```
3. Store the dump outside the repo (encrypted volume / secrets store).

**Restore:**

1. Prefer provider “restore to new database” / PITR, then re-point env vars.
2. Or:
   ```bash
   pg_restore --clean --if-exists -d "$POSTGRES_URL_NON_POOLING" good_budget_YYYYMMDD.dump
   ```
3. Run `npx prisma migrate status` (verify only) before pointing the app at a restored DB.
4. **Never** `prisma migrate reset` against production.

**Phase 0 did not** create a dump file (to avoid writing credentials-adjacent artifacts without approval). **Backup readiness:** Procedure documented; **operator must still take a fresh dump/snapshot before WP9/WP12.**

---

## 4. Build, lint, TypeScript, tests

| Check | Executed | Result | Evidence |
|-------|----------|--------|----------|
| Dependency install state | Yes | `node_modules` present; lockfile used | Listing |
| `npm run lint` | Yes | **Pass** (exit 0) with **2 warnings** | `date-range-picker.tsx` react-hooks/exhaustive-deps |
| `npx tsc --noEmit` | Yes | **Pass** (exit 0, no output) | — |
| `npm run build` | Yes | **Pass** (Next.js 14.2.3) | Route table below |
| Automated unit/E2E tests | Yes (discovery) | **None exist** | No `*.test.*` / `*.spec.*`; no test scripts |
| CI workflows | Yes | **None** | No `.github/workflows` |

### Production build route sizes (measured)

| Route | Size | First Load JS |
|-------|------|---------------|
| `/` | 112 kB | **426 kB** |
| `/manage` | 3.37 kB | **294 kB** |
| `/transactions` | 21.5 kB | **205 kB** |
| `/wizard` | 589 B | 162 kB |
| `/sign-in`, `/sign-up` | 198 B | 111 kB |
| Shared | — | 87.3 kB |
| Middleware | 47.6 kB | — |

All listed app routes: **ƒ Dynamic**.

---

## 5. Dependency and security baseline

### Locked versions (re-confirmed)

| Package | Locked |
|---------|--------|
| `next` | **14.2.3** |
| `react` / `react-dom` | **18.3.1** |
| `@clerk/nextjs` | **5.0.3** |
| `@prisma/client` / `prisma` | **5.13.0** |
| `@tanstack/react-query` | **5.32.1** |
| `typescript` | **5.4.5** |
| `eslint-config-next` | **14.2.3** |
| `zod` | **3.23.5** |

### `npm audit` (executed)

| Severity | Count |
|----------|-------|
| critical | **2** |
| high | **22** |
| moderate | **5** |
| low | **1** |
| **total** | **30** |

**Immediate attention (confirmed):**

1. **`next@14.2.3`** — critical/high advisories in audit tree (cache poisoning, image optimization DoS, plus known CVEs from prior research: middleware auth bypass fixed in 14.2.25+, RSC DoS fixes in later 14.2.x). **Phase 1 WP1.**
2. **`@clerk/nextjs` tree** — critical/high via nested packages; plan Clerk bump with Next major, and review changelog during WP1/WP10.

**Important but secondary:** Many high findings are transitive (eslint/tooling, minimatch, postcss, lodash, zod memory exhaustion). Address via upgrades; do not `npm audit fix --force` blindly.

**Potential (not invented metrics):** Direct jump to Next 16 without staging — high breakage risk (React 19 + Clerk). See compatibility report.

**No packages were upgraded in Phase 0.**

---

## 6. Environment and deployment

### Required env names observed in `.env.local` (values redacted)

**Clerk:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`

**Postgres / Vercel storage style:** `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_URL`, `POSTGRES_URL_*`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_DATABASE`, …

**Other:** `VERCEL_OIDC_TOKEN`

Prisma schema requires at minimum: `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`.

### Deploy assumptions

| Item | Finding |
|------|---------|
| Platform | **Vercel** (linked project `good-budget`) |
| Build command | `npm run build` (Next default) |
| Install | `npm ci` / `npm install` + `postinstall` → `prisma generate` |
| `vercel.json` | Absent (platform defaults) |
| Runtime | Node serverless / Next on Vercel |

---

## 7. Performance baseline

### Measured

- First Load JS from `next build` (table in §4) — **measured**.
- Middleware ~47.6 kB — **measured**.
- DB round-trip `SELECT 1` + counts: **~9.7 s** wall time on first cold connect from this environment — **measured once**; treat as environment-specific, not CWV.

### Not measured (do not invent)

- Lighthouse scores
- Field Core Web Vitals (LCP/INP/CLS)
- Bundle analyzer breakdown of recharts vs emoji-mart

### Estimates (architectural, not lab numbers)

- Heavy client deps on dashboard: `recharts`, `@emoji-mart/*` — **likely** primary drivers of `/` 426 kB FLJS (consistent with audit; not re-analyzed with webpack analyzer in Phase 0).

---

## 8. Functional / regression baseline

### Database connectivity (safe read-only)

| Check | Result |
|-------|--------|
| `prisma validate` | **Pass** |
| `$queryRaw SELECT 1` | **Pass** (`connected: true`) |
| Row counts (aggregates only) | `userSettings: 9`, `transactions: 189`, `categories: 15` |

No writes, migrations, or dumps performed.

### HTTP probes (`next start -p 3456`, unauthenticated)

| Path | Status | Interpretation |
|------|--------|----------------|
| `/sign-in` | **200** | Public auth UI available |
| `/sign-up` | **200** | Public auth UI available |
| `/` | **307 → /sign-in`** | RSC `currentUser` gate works |
| `/wizard` | **307 → /sign-in`** | RSC auth gate works |
| `/transactions` | **200** | **Confirmed gap:** page HTML without login |
| `/manage` | **200** | **Confirmed gap:** page HTML without login |
| `/api/categories` | **307 → /sign-in`** | API redirects (not 401 JSON) |
| `/api/user-settings` | **307 → /sign-in`** | Same |

### Code-review confirmation (not interactive UI)

| Workflow | Status |
|----------|--------|
| Auth + userId scoping on actions/APIs | Present (audit still valid) |
| Transaction **create** / **delete** | Present |
| Transaction **edit/update** | **Not implemented** — no `UpdateTransaction` |
| Category create/delete | Present |
| Currency update | Present (`UpdateUserCurrency`) |
| Financial aggregates via `$transaction` | Present |
| Category lookup missing `type` | **Still present** (BUG-02 confirmed) |
| Money as `Float` | **Still present** |
| Middleware `protect` | **Still absent** |

### Not executed (requires authenticated browser session)

- Full Clerk sign-in UI click-through
- Create/delete transaction in UI
- Category management in UI
- Currency change end-to-end
- Dashboard chart correctness vs DB
- Cross-user isolation live attempt
- Lighthouse

These remain **manual QA** before production Phase 1 deploy.

---

## 9. Audit drift since prior audit

| Finding | Still true? |
|---------|-------------|
| Next 14.2.3 | Yes |
| Bare `clerkMiddleware()` | Yes |
| `/manage`, `/transactions` CSR no server auth | Yes (**HTTP 200** re-confirmed) |
| API redirect on unauth | Yes (**307** re-confirmed) |
| No tests / CI | Yes |
| Build FLJS ~426 kB on `/` | Yes (re-measured) |
| npm audit ~30 vulns | Yes (30 total) |
| Docs system (`AGENTS.md`, `docs/`) | **New** since original audit commit baseline |
| Vercel link + `.env.local` | Present locally now |

---

## 10. Unresolved blockers / conditions

| ID | Item | Blocks |
|----|------|--------|
| B1 | Next 14.2.3 unpatched | Production security posture; Phase 3 Next 16 |
| B2 | Middleware + manage/transactions auth gaps | Production hardening |
| B3 | Docs working tree uncommitted | Clean Phase 1 PR hygiene |
| B4 | No automated tests | Regression safety for upgrades |
| B5 | No fresh DB dump taken in Phase 0 | Schema migrations (WP9/WP12) |
| B6 | Interactive authenticated E2E not run | Full functional sign-off |
| B7 | Money type decision (Decimal vs cents) | WP12 only |

**B1–B2 are Phase 1 work, not Phase 0 failures.** Phase 0 successfully **baselines** them.

---

## 11. Recommended next steps

1. **Human:** Commit documentation / Phase 0 report (or stash) so `main` tip includes the AI docs system.
2. **Human:** Take a Postgres snapshot/`pg_dump` before any schema work.
3. **Phase 1 / WP1:** Upgrade Next to ≥ **14.2.35** (or latest patched 14.2.x) — do **not** jump to 16 yet.
4. **Phase 1 / WP2–WP4:** Clerk protect, API 401s, category `type` filter, query invalidation.
5. Schedule authenticated manual QA checklist after WP1–WP2.

---

## 12. Files changed in Phase 0

Documentation only:

- **Created:** `docs/modernization/PHASE_0_BASELINE_REPORT.md` (this file)
- **Updated:** `docs/modernization/EXECUTION_PLAN.md`, `docs/modernization/MIGRATION_RISK_ASSESSMENT.md`, `docs/modernization/DATABASE_MIGRATION_PLAN.md`, `docs/modernization/MODERNIZATION_ROADMAP.md` (foundation status)

No application source or dependency files modified.
