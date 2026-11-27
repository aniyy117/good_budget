# WP12 — Money Decimal Migration Report

**Date:** 27 November 2026  
**Decision:** Option **A** — `Decimal(18,2)` amounts / history; `Decimal(18,8)` `fxRate`  
**Also:** `Transaction.updateAt` → `updatedAt` (`@updatedAt`)

Related: [design](../superpowers/specs/2026-11-27-wp12-money-decimal-design.md) · [`DATABASE_MIGRATION_PLAN.md`](./DATABASE_MIGRATION_PLAN.md)

---

## 1. Verdict

| Criterion | Result |
|-----------|--------|
| Schema uses Decimal for money fields | **Yes** |
| Migration SQL in repo | **Yes** — `20261127120000_money_decimal_and_updated_at` |
| App writes via `toDecimal` / reads via `toNumber` | **Yes** |
| Overview/category stats use `amountInBase` sums | **Yes** (multi-currency correctness) |
| Applied to remote DB this session | **No** — run only after backup + your OK |
| Lint/typecheck/test/build | **Pass** (23 unit tests) |

**Production/staging apply:**

```bash
# After backup / PITR confirmed:
npx prisma migrate deploy
```

---

## 2. Files

| Area | Paths |
|------|--------|
| Schema / migration | `prisma/schema.prisma`, `prisma/migrations/20261127120000_*` |
| Helpers | `lib/money.ts`, `lib/__tests__/money.test.ts` |
| Writes | create/delete transaction actions |
| Reads | balance, categories, transactions-history, history-data |

---

## 3. Residual

Modernization plan packages **WP0–WP12** are complete in-repo. Remaining ops: deploy WP9+WP12 migrations when DB is reachable; optional Clerk auth E2E; optional Clerk v7.
