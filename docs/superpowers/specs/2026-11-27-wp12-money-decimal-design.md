# WP12 — Money Type Migration Design

**Date:** 2026-11-27  
**Status:** Approved — Option A (Decimal) + include `updateAt` → `updatedAt`  
**Audit:** DATA-01 · DATA-03 optional piggyback  
**Related:** [`DATABASE_MIGRATION_PLAN.md`](../../modernization/DATABASE_MIGRATION_PLAN.md)

## Problem

`Transaction.amount`, `amountInBase`, `fxRate`, and history `income`/`expense` use Prisma `Float`. Floating-point drift is a known financial integrity risk.

## Decision (choose one)

| Option | Storage | Pros | Cons |
|--------|---------|------|------|
| **A — Decimal (recommended)** | `@db.Decimal(18, 2)` for amounts; rate `@db.Decimal(18, 8)` | Matches currency UX; Prisma `Decimal` | Careful JSON/serialize; avoid `Number()` |
| **B — Integer minor units** | `Int` / `BigInt` cents/paise | Exact JS arithmetic | JPY scale 0; every UI path converts |

**Recommendation:** **A — Decimal(18, 2)** for `amount`, `amountInBase`, history totals; **Decimal(18, 8)** for `fxRate`. Keep allowlist currencies; JPY still stored with `.00` or validate scale in Zod.

## Migration approach (expand-contract)

1. **Backup** production / staging (`pg_dump` or provider PITR) — **required**.
2. Add new Decimal columns alongside Float (or alter type in one migration if staging-only and approved).
3. Backfill: `new = old` cast; verify row counts and sum deltas ≈ 0.
4. Switch Prisma schema + app reads/writes to Decimal (`Prisma.Decimal` / string from forms).
5. Dual-read period optional; then drop Float columns.
6. Same for `MonthHistory` / `YearHistory`.
7. Optional same WP: rename `updateAt` → `updatedAt` (DATA-03) if grepped safe.

## Non-goals

- Historical FX rebase
- Changing multi-currency snapshot semantics
- Production migrate without your explicit OK

## Exit

- Schema + migration(s) in repo
- App compiles; unit tests for money helpers
- Staging migrate applied only when you approve
- Docs + WP12 report

## Approval needed

Reply with: **A (Decimal)** or **B (cents)**, and whether to include **`updateAt` rename** in the same WP. Confirm backup before any `migrate deploy`.
