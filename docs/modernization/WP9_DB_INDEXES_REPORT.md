# WP9 — Database Indexes Report

**Date:** 27 November 2026  
**Work package:** WP9  
**Stack:** Prisma 5.13 · PostgreSQL  

Related: [`EXECUTION_PLAN.md`](./EXECUTION_PLAN.md) · [`DATABASE_MIGRATION_PLAN.md`](./DATABASE_MIGRATION_PLAN.md) · DATA-02

---

## 1. Verdict

| Criterion | Result |
|-----------|--------|
| `Transaction @@index([userId, date])` in schema | **Yes** |
| Migration SQL added | **Yes** — `20261127111659_transaction_user_date_index` |
| Applied to remote DB this session | **No** — Neon unreachable (`P1001`); run `npx prisma migrate deploy` when online |
| `updateAt` → `updatedAt` (DATA-03) | **Deferred** (Approach A) |
| Lint / tsc / test / build | **Pass** |
| WP9 ready for approval | **Yes** (apply migrate when DB up) |

**Do not start WP10** until explicitly approved. **Do not commit** unless requested.

---

## 2. Migration

```sql
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction"("userId", "date");
```

Apply (local/staging/prod with backup):

```bash
npx prisma migrate deploy
```

---

## 3. Residual

1. DATA-03 — rename `updateAt` → `updatedAt` (schema + `lib/types.ts`).  
2. Next when approved: **WP10** — Next.js 16 + React 19 + Clerk bump (large; staged).
