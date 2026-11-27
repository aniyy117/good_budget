# Database Migration Plan

**Status:** Plan only — no migrations executed as part of the documentation task or Phase 0.  
**ORM:** Prisma 5.13 · **DB:** PostgreSQL (Vercel-linked; live read verified in Phase 0)  

Related: [`prisma/schema.prisma`](../../prisma/schema.prisma) · [Audit DATA-*](../audit/NEXTJS_APPLICATION_AUDIT.md) · [`MIGRATION_RISK_ASSESSMENT.md`](./MIGRATION_RISK_ASSESSMENT.md) · [`PHASE_0_BASELINE_REPORT.md`](./PHASE_0_BASELINE_REPORT.md)

### Phase 0 database observations (read-only)

| Check | Result |
|-------|--------|
| `prisma validate` | Pass |
| Connectivity | Pass (`SELECT 1`) |
| Approximate scale | 9 `UserSettings`, 189 `Transaction`, 15 `Category` |
| Backup taken in Phase 0 | **No** — operator must snapshot before Wave 1+ |
| Schema drift vs plan | Unchanged (`Float` amounts, `updateAt` typo, no `Transaction` date index) |

---

## Current schema (summary)

| Model | Keys / notes |
|-------|----------------|
| `UserSettings` | PK `userId`; `currency` string |
| `Category` | Unique `(name, userId, type)` |
| `Transaction` | UUID `id`; `Float` `amount`; denormalized category fields; field typo `updateAt` |
| `MonthHistory` | PK `(day, month, year, userId)` |
| `YearHistory` | PK `(month, year, userId)` |

Env URLs (names only): `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`.

---

## Goals

1. Improve query performance with indexes.
2. Fix naming (`updatedAt`) safely.
3. Improve financial precision (replace `Float`).
4. Preserve all user financial history.
5. Support backup and rollback.

---

## Decision required before money migration

**Recommendation:** Store money as **integer minor units (cents/paise)** *or* Prisma `Decimal` (`@db.Decimal(18, 2)`).

| Approach | Pros | Cons |
|----------|------|------|
| Integer cents | Exact arithmetic; simple in JS | Display conversion everywhere; multi-currency decimals vary (JPY=0) |
| `Decimal` | Natural currency amounts | Careful serialization; JS number coercion pitfalls |

**Default for planning:** Prefer **`Decimal(18, 2)`** for INR/USD/EUR/GBP/JPY allowlist with validation that JPY uses 0 decimal places in UI — **finalize before WP12**. Do not implement until product approves.

---

## Migration waves

### Wave 1 — Indexes (low risk)

Add to `Transaction`:

```prisma
@@index([userId, date])
```

Optional: `@@index([userId])` on `Category` if not covered by unique.

**Steps:**

1. Snapshot / backup production (provider backup or `pg_dump`).
2. `prisma migrate dev --name transaction_user_date_index` on staging.
3. Verify `EXPLAIN` on history queries.
4. Apply to production off-peak.
5. Rollback: reverse migration dropping index (non-destructive to data).

**Audit:** DATA-02

---

### Wave 2 — `updateAt` → `updatedAt` (medium risk)

1. Add `updatedAt` with `@updatedAt` (or rename via SQL carefully).
2. Backfill from `updateAt` / `createdAt`.
3. Update Prisma client usages (grep `updateAt`).
4. Drop old column after verify.

**Audit:** DATA-03

---

### Wave 3 — Money precision (high risk)

1. Approve Decimal vs cents.
2. Add new columns (`amountDecimal` or `amountCents`) alongside `amount`.
3. Backfill in batches; verify sums match within tolerance.
4. Switch application reads/writes to new fields.
5. Dual-write period optional.
6. Drop old `Float` columns after sign-off.
7. Update `MonthHistory` / `YearHistory` income/expense types consistently.
8. Reconcile: sum(`Transaction`) vs history tables; fix drift before cutover.

**Audit:** DATA-01 / WP12

---

### Wave 4 — Optional integrity (future)

- Strategy for category rename / delete with existing transactions.
- Soft-delete or restrict delete when transactions reference category name.
- Orphan cleanup if Clerk users are deleted.

---

## Backup and rollback requirements

Before **any** production migration:

1. **Backup:** Provider point-in-time recovery enabled **or** fresh `pg_dump`.
2. **Record:** Migration name, timestamp, operator, git SHA.
3. **Staging first:** Identical schema apply + app build against staging DB.
4. **Rollback plan written** in the PR (restore snapshot vs down migration).
5. **No** `prisma migrate reset` on production.
6. **No** force-push of migration history rewriting without approval.

---

## Application code touchpoints (when executing)

- `app/(dashboard)/_actions/transactions.ts`
- `app/(dashboard)/transactions/_actions/deleteTransaction.ts`
- `app/api/stats/**`, `transactions-history`, `history-data`
- Formatters in `lib/helpers.ts`
- Any CSV export amount fields

---

## Verification queries (examples)

After Wave 3 backfill (adjust to chosen representation):

- Per-user total income/expense from `Transaction` vs `YearHistory` / `MonthHistory`.
- Row counts before/after.
- Spot-check sample users from staging.

---

## Explicit non-actions (documentation phase)

- Do not run `prisma migrate` against production from this docs task.
- Do not change `schema.prisma` until a code WP is approved.
