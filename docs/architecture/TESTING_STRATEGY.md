# Testing Strategy

**Current state (WP11):** Vitest unit suite (`npm test`, 19 tests), `npm run typecheck`, GitHub Actions CI, Playwright public smoke scaffold. Authenticated E2E still needs a Clerk test project.  
**Target:** Layered tests + CI before claiming full production readiness.

Related: [`AGENTS.md`](../../AGENTS.md) · [`EXECUTION_PLAN.md`](../modernization/EXECUTION_PLAN.md) · [`WP11_TESTS_CI_REPORT.md`](../modernization/WP11_TESTS_CI_REPORT.md)

---

## Goals

1. Prevent regressions in auth gating, money math/aggregates, and CRUD flows.
2. Make upgrades (Next major bumps) verifiable in CI.
3. Keep unit tests fast; reserve E2E for critical paths.

---

## Tooling

| Layer | Tool | Status |
|-------|------|--------|
| Unit | Vitest | **In use** — schemas, FX, helpers |
| E2E | Playwright | **Scaffold** — public `/sign-in`, `/sign-up` |
| Static | `eslint`, `tsc` | **CI** — `.github/workflows/ci.yml` (`next build` on Vercel/local) |

---

## Commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e   # requires app reachable (see playwright.config.ts)
```

---

## Critical cases still to expand

- Authenticated: wizard → create/delete transaction → manage category (Clerk test secrets).
- User isolation (User A cannot touch User B data) via action/integration tests.
- Aggregate create/delete consistency with mocked or test Prisma.

---

## CI

GitHub Actions on `pull_request` / `push` to main:

1. `npm ci --legacy-peer-deps`
2. Lint
3. Typecheck
4. Unit tests
Build is **not** in CI (avoids Clerk/DB env secrets). Run `npm run build` locally or on Vercel.

E2E is **not** in CI yet (browser install + Clerk).

---

## What not to do

- Do not claim “fully tested” until authenticated E2E exists and passes.
- Do not commit real Clerk/Postgres production secrets into CI.
