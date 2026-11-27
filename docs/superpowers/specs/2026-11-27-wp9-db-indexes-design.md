# WP9 — Database Indexes (+ optional naming)

**Date:** 2026-11-27  
**Status:** Approved — Approach A (index only)  
**Audit:** DATA-02 (index); DATA-03 optional (`updateAt`)  
**Related:** [`DATABASE_MIGRATION_PLAN.md`](../../modernization/DATABASE_MIGRATION_PLAN.md) · Wave 1

## Goals

1. Add `@@index([userId, date])` on `Transaction` for history/range queries.
2. Decide whether to include `updateAt` → `updatedAt` in the same WP or defer.

## Approaches

| | Approach | Tradeoff |
|--|----------|----------|
| A | **Index only** (DATA-02) | Safer; no app field rename |
| B | Index + rename `updateAt` → `updatedAt` with `@updatedAt` | Fixes DATA-03; needs Prisma field update everywhere `updateAt` is referenced |
| C | Index now; rename in a later tiny WP | Clearest rollback story |

**Recommend A for WP9** unless grep shows `updateAt` unused in app code (schema-only typo) — then B is low risk.

## Constraints

- Backup / confirm migrate target before destructive steps; index add is non-destructive.
- Never run production migrate without user approval.
- Float→Decimal remains WP12.
- No commits unless requested.

## Exit

- Migration created (and applied locally if user OK).
- Schema has `@@index([userId, date])`.
- Lint/tsc/build green.
- Docs + short WP9 report.
