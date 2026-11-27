# Migration Risk Assessment

Assesses risks for GoodBudget’s phased modernization (security fixes → architecture → Next.js 16 → performance → tests). Does not authorize production changes by itself.

Related: [Audit](../audit/NEXTJS_APPLICATION_AUDIT.md) · [`EXECUTION_PLAN.md`](./EXECUTION_PLAN.md) · [`DATABASE_MIGRATION_PLAN.md`](./DATABASE_MIGRATION_PLAN.md) · [`PHASE_0_BASELINE_REPORT.md`](./PHASE_0_BASELINE_REPORT.md)

**Phase 0 update (27 November 2026):** Risks R1–R2 **re-confirmed with evidence** (Next was 14.2.3; HTTP 200 on `/manage` and `/transactions` without auth). Hosting resolved as **Vercel-linked**. Live DB readable (189 transactions). Interactive authenticated QA still outstanding (R11 residual).

**WP1 update (27 November 2026):** Next upgraded to **14.2.35** (latest 14.2.x). R1 **partially mitigated** for 14.2-line patches (including Dec 2025 RSC DoS floor). Residual `npm audit` Next findings remain until a **15.5+/16** upgrade (R7 path). See [`WP1_NEXTJS_SECURITY_UPGRADE_REPORT.md`](./WP1_NEXTJS_SECURITY_UPGRADE_REPORT.md).

**WP2 update (27 November 2026):** R2 **mitigated** — middleware + layouts redirect unauthenticated users; `/manage`/`/transactions` no longer return 200 logged out; APIs return 401 JSON. R5 (category type) mitigated. R3 partially addressed on server (401); client fetch helper still WP3. Dual-user IDOR lab still outstanding. See [`WP2_AUTHENTICATION_AUTHORIZATION_REPORT.md`](./WP2_AUTHENTICATION_AUTHORIZATION_REPORT.md).

---

## Risk summary

| ID | Risk | Likelihood | Impact | Phase | Mitigation |
|----|------|------------|--------|-------|------------|
| R1 | Exploitation of known Next CVEs | Medium (14.2 floor done; residual majors remain) | High | 1→3 | **WP1 done (14.2.35)**; clear remaining via Stage B/C major upgrade |
| R2 | Unauthenticated dashboard shells | Low (mitigated WP2) | Medium–High | 1 | **WP2 done** — re-test after Clerk upgrades |
| R3 | Client fetch breaks when APIs stop redirecting | Medium | Medium | 1–3 | Server returns 401 (WP2); add client `res.ok` helper in WP3 |
| R4 | Aggregate drift (history tables) | Medium | Medium | 1–2 | Keep `$transaction`; add tests; optional reconcile job later |
| R5 | Wrong category type on create | Low (mitigated WP2) | Medium | 1 | **WP2 done** — filter by type |
| R6 | Onboarding auto-creates INR via GET | High | Low–Medium | 2 | **Mitigated (WP5)** — read-only GET + currency upsert |
| R7 | Next 16 + React 19 + Clerk simultaneous breakages | High if unstaged | High | 3 | Staged upgrades; smoke E2E; rollback tag |
| R8 | Middleware/proxy rename mistakes on Next 16 | Medium | High | 3 | Follow official guide; keep auth tests |
| R9 | Float money precision errors | Medium over time | Medium | 5 / WP12 | Decimal or cents migration with backup |
| R10 | Index migration locks large tables | Low–Medium | Medium | 4 | Concurrent index strategies; off-peak |
| R11 | No tests → silent regressions | High | High | 5 | Add Vitest/Playwright before large refactors when possible |
| R12 | Secret leakage in docs/PRs | Low | Critical | All | Names only; never paste `.env.local` |
| R13 | Devtools / audit noise in prod | Medium | Low–Medium | 1–4 | Gate Devtools; dependency hygiene |

---

## Risk by work package

| WP | Primary risks | Go / no-go notes |
|----|---------------|------------------|
| WP1 Next patch | R1 residual if incomplete bump | Must build + smoke |
| WP2 Auth middleware | R2, lockout if public routes wrong | Keep `/sign-in` `/sign-up` public |
| WP3 API 401 | R3 | Couple client + server changes |
| WP4 Category type | R5 | Low blast radius |
| WP5 Onboarding | R6 | Test wizard → dashboard gate |
| WP10 Next 16 | R7, R8 | Do not combine with money migration |
| WP12 Money type | R9 | Requires explicit approval + backup |

---

## Data integrity risks

1. **Denormalized category strings** on transactions — renaming categories does not update history rows (product limitation).
2. **History aggregates** — bugs in create/delete can desync charts from raw transactions.
3. **Float amounts** — cumulative rounding; financial correctness risk (R9).
4. **No FK to Clerk user** — deleting a Clerk user leaves orphaned rows (ops process needed).

---

## Rollback strategies

| Change type | Rollback |
|-------------|----------|
| Dependency bump | Revert PR / restore lockfile; redeploy previous build |
| Middleware auth | Revert middleware; confirm Clerk dashboard URLs |
| Prisma migration | Restore DB snapshot; `prisma migrate` resolve — see DB plan |
| Next 16 branch | Keep `main` on 14.x until smoke passes; merge only when green |

---

## Acceptance before production deploy

- [ ] Lint + build green
- [ ] Auth smoke (signed out / signed in)
- [ ] Create + delete transaction; charts update
- [ ] Manage category create/delete
- [ ] No secrets in git diff
- [ ] Roadmap status updated

---

## Open items needing human input

- ~~Confirm hosting (Vercel vs self-hosted)~~ **Resolved in Phase 0:** Vercel project `good-budget` linked via `.vercel/`.
- Choose Decimal vs integer cents before WP12.
- Provision Clerk + DB credentials for CI E2E (never use production secrets in docs).
- Commit or stash uncommitted docs before Phase 1 PRs.
- Take explicit Postgres snapshot/`pg_dump` before WP9/WP12 (procedure in Phase 0 report; dump not created in Phase 0).
- Run authenticated manual QA after WP1–WP2.
