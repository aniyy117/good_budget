# Testing Strategy

**Current state:** Minimal Vitest suite for security validation schemas (`npm test`). No E2E/CI yet.  
**Target:** Layered tests + CI gates before claiming production readiness (modernization Phase 5).

Related: [`AGENTS.md`](../../AGENTS.md) · [`EXECUTION_PLAN.md`](../modernization/EXECUTION_PLAN.md)

---

## Goals

1. Prevent regressions in auth gating, money math/aggregates, and CRUD flows.
2. Make upgrades (Next 14 → 16) verifiable.
3. Keep tests fast enough for local iteration; reserve E2E for critical paths.

---

## Recommended tooling (not installed yet)

| Layer | Tool | Scope |
|-------|------|-------|
| Unit | Vitest | Zod schemas, helpers (`DateToUTCDate`, formatters), pure reducers |
| Component | Vitest + React Testing Library | Dialogs, pickers (mock Server Actions) |
| Integration | Vitest + Prisma test DB or mocked Prisma | Server Actions with ownership rules |
| E2E | Playwright | Sign-in → wizard → create transaction → delete → manage category |
| Static | `eslint`, `tsc`, `next build` | Every PR |

Do not add Jest if Vitest is chosen — pick one unit runner.

---

## Critical test cases (priority order)

### Auth and isolation

- Unauthenticated access to dashboard/API returns redirect or 401 as designed.
- User A cannot read/update/delete User B’s transactions or categories.

### Onboarding

- Settings are created only via the intended mutation path (not GET).
- Currency must be in the allowlist.

### Transactions

- Create income/expense updates `Transaction` + month/year history.
- Delete reverses aggregates correctly.
- Category lookup respects **type**.
- Date range validation (`MAX_DATE_RANGE_DAYS`).

### Categories

- Unique `(name, userId, type)` enforced.
- Delete does not cross users.

### Regression after upgrades

- Build + lint + smoke E2E on Next bump PRs.

---

## Verification required before “done” (even without tests today)

```bash
npm run lint
npm run build
```

When scripts exist:

```bash
npm run typecheck
npm test
npm run test:e2e
```

---

## CI (planned)

GitHub Actions (or Vercel checks) should run:

1. Install + `prisma generate`
2. Lint
3. Typecheck
4. Unit tests
5. Build  
E2E may run on main/PR with secrets for Clerk test instance — **Needs manual setup**.

---

## What not to do

- Do not claim “fully tested” until suites exist and pass in CI.
- Do not commit real Clerk/Postgres production secrets into CI; use dedicated test projects.
- Do not skip build verification after dependency upgrades.
