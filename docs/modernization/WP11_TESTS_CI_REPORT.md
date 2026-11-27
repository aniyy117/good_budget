# WP11 — Tests + CI Report

**Date:** 27 November 2026  
**Work package:** WP11  

Related: [`TESTING_STRATEGY.md`](../architecture/TESTING_STRATEGY.md) · [`EXECUTION_PLAN.md`](./EXECUTION_PLAN.md)

---

## 1. Verdict

| Criterion | Result |
|-----------|--------|
| Expanded Vitest unit coverage | **Yes** — helpers, overview/delete-category schemas (19 tests) |
| `npm run typecheck` script | **Yes** |
| GitHub Actions CI on PR/push | **Yes** — `.github/workflows/ci.yml` |
| Playwright public smoke scaffold | **Yes** — `e2e/smoke.spec.ts` |
| Authenticated E2E (wizard → CRUD) | **Deferred** — needs Clerk test project + secrets |
| WP11 ready for approval | **Yes** |

**Do not start WP12** until explicitly approved. **Commit when requested.**

---

## 2. Commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
# optional local E2E (after build, with server):
npm run build && E2E_SKIP_WEBSERVER=1 npm run start &
E2E_SKIP_WEBSERVER=1 npm run test:e2e
# or let Playwright start `npm run start` after a prior build
```

CI runs: install → lint → typecheck → unit tests → build (placeholder Clerk/DB env).

---

## 3. Files

| Path | Role |
|------|------|
| `lib/__tests__/helpers.test.ts` | Date/formatter helpers |
| `lib/__tests__/overview-schema.test.ts` | Date range + delete category |
| `playwright.config.ts` / `e2e/smoke.spec.ts` | Public route smoke |
| `.github/workflows/ci.yml` | PR gate |
| `package.json` | `typecheck`, `test:e2e` |

---

## 4. Residual

1. Clerk-authenticated Playwright flow when test keys exist.  
2. Next: **WP12** money Decimal migration when approved.
