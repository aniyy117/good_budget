# Security Guidelines

Related: [`AGENTS.md`](../../AGENTS.md) · [Audit](../audit/NEXTJS_APPLICATION_AUDIT.md) · [`MIGRATION_RISK_ASSESSMENT.md`](../modernization/MIGRATION_RISK_ASSESSMENT.md)

---

## Principles

1. Authenticate every privileged request.
2. Authorize every data access with the Clerk user id.
3. Validate all untrusted input with Zod.
4. Fail closed; never leak other users’ data.
5. Keep secrets server-side only.
6. Treat financial records and aggregates as integrity-critical.

---

## Clerk integration

### Current

- `ClerkProvider` in `app/layout.tsx`.
- `clerkMiddleware()` in `middleware.ts` **without** route protection.
- `currentUser()` checks in some RSC pages, all API routes, and Server Actions.
- Gaps: `/manage` and `/transactions` lack server-side auth gates (audit SEC-02 / SEC-03).

### Required for new work / Phase 1

- Configure public routes (`/sign-in`, `/sign-up`, static assets) and protect everything else via Clerk middleware (`auth.protect()` or current Clerk-recommended equivalent).
- Add a server auth check in `app/(dashboard)/layout.tsx` (defense in depth).
- Keep using official `@clerk/nextjs` server APIs; avoid decoding session cookies manually.

---

## User-specific data isolation

Every Prisma read/write/delete for tenant data **must** include `userId: user.id` (or a unique constraint that embeds `userId`).

Examples of correct patterns already in the codebase:

- Category delete via `name_userId_type`.
- Transaction delete with ownership check before aggregate updates.

When creating transactions, look up categories by **`userId` + `name` + `type`** (audit BUG-02).

---

## Server Actions and APIs

| Rule | Detail |
|------|--------|
| Auth | Reject unauthenticated callers |
| API response | Prefer `401` JSON for Route Handlers used by `fetch`; do not `redirect` HTML to XHR clients |
| Validation | Zod on bodies and query params |
| Delete IDs | Validate UUID (or actual id format) before Prisma |
| Errors | Stable client messages; log details server-side |
| CSRF | Rely on Next Server Action origin checks; keep Next patched |

Do not introduce state-changing **GET** endpoints. Settings creation belongs in a mutation (audit BUG-01).

---

## Environment variables

**Document names only. Never paste values into markdown, issues, or commits.**

| Name | Side | Purpose |
|------|------|---------|
| `POSTGRES_PRISMA_URL` | Server | Pooled DB |
| `POSTGRES_URL_NON_POOLING` | Server | Direct DB |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | Clerk browser |
| `CLERK_SECRET_KEY` | Server | Clerk server |
| `NODE_ENV` | Runtime | Prisma singleton behavior |

`.env` / `.env.local` stay gitignored. Provide `.env.example` with empty placeholders when adding onboarding docs (no real secrets).

---

## Financial data security

- Do not log full transaction dumps in production.
- Preserve aggregate consistency (`$transaction`).
- Plan money type migration carefully (Float → Decimal/cents) to avoid silent corruption — see [`DATABASE_MIGRATION_PLAN.md`](../modernization/DATABASE_MIGRATION_PLAN.md).
- Export CSV only for the authenticated user’s filtered rows.

---

## Dependency security

- Next **14.2.3** is below patched 14.2.x releases (audit SEC-01). Prioritize upgrade when dependency work is approved.
- Re-run `npm audit` after upgrades; do not blindly `npm audit fix --force`.
- Keep React Query Devtools out of production UI.

---

## Checklist for agents (security)

- [ ] Auth check present
- [ ] `userId` filter on every query
- [ ] Zod validation
- [ ] No secrets in client or docs
- [ ] API errors appropriate for client type
- [ ] No new side-effecting GETs
