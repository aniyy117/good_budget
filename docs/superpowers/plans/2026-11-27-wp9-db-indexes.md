# WP9 — Database Indexes Implementation Plan

> **Do not git commit unless the user explicitly asks.** Do not run production migrations without approval.

**Goal:** Add `Transaction @@index([userId, date])` (DATA-02). Optional rename deferred unless approved as Approach B.

**Architecture:** Prisma schema change + SQL migration. App queries already filter by `userId` + date ranges; index speeds those paths.

**Tech Stack:** Prisma 5.13 · PostgreSQL

## Global Constraints

- Prefer Approach **A** (index only) unless user approves rename.
- Confirm `npx prisma migrate dev` against local/staging only when user says so.
- No WP10/WP12 scope.

---

### Task 1: Confirm `updateAt` usage

- [ ] Grep codebase for `updateAt` / `updatedAt`
- [ ] If unused in TS: note “rename optional / safe”; keep out of WP9 unless user wants B

### Task 2: Schema index

**Files:** `prisma/schema.prisma`

- [ ] Add under `Transaction`:

```prisma
@@index([userId, date])
```

### Task 3: Migration

- [ ] With user approval: `npx prisma migrate dev --name transaction_user_date_index`
- [ ] Or create migration SQL manually if migrate can't run in env

### Task 4: Docs + verify (no commit)

- [ ] Update EXECUTION_PLAN / ROADMAP / WP9 report
- [ ] `npm run lint` · `npx tsc --noEmit` · `npm run build`

---

## Spec coverage

| Requirement | Task |
|-------------|------|
| DATA-02 index | Tasks 2–3 |
| DATA-03 rename | Only if Approach B approved |
| Docs | Task 4 |
