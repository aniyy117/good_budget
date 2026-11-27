# WP12 — Decimal Money Migration Plan

> **Do not `prisma migrate deploy` to production without explicit user OK + backup.**

**Goal:** Replace Float money fields with `Decimal`; rename `updateAt` → `updatedAt`.

**Approach:** Option A — `Decimal(18,2)` amounts/history; `Decimal(18,8)` fxRate. Single ALTER migration with `USING` cast (small dataset).

**Do not commit unless user asks.**
