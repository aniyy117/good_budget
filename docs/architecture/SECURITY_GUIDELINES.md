# Security Guidelines

Related: [`AGENTS.md`](../../AGENTS.md) · [Audit](../audit/NEXTJS_APPLICATION_AUDIT.md) · [`WP2_AUTHENTICATION_AUTHORIZATION_REPORT.md`](../modernization/WP2_AUTHENTICATION_AUTHORIZATION_REPORT.md) · [`MIGRATION_RISK_ASSESSMENT.md`](../modernization/MIGRATION_RISK_ASSESSMENT.md)

---

## Principles

1. Authenticate every privileged request.
2. Authorize every data access with the Clerk user id.
3. Validate all untrusted input with Zod.
4. Fail closed; never leak other users’ data.
5. Keep secrets server-side only.
6. Treat financial records and aggregates as integrity-critical.

---

## Clerk integration (current — post WP2)

**SDK:** `@clerk/nextjs@5.0.3` on Next.js **14.2.35** (`middleware.ts`, not `proxy.ts`).

| Layer | Behavior |
|-------|----------|
| Middleware | Public: `/sign-in`, `/sign-up`. Private pages: `redirectToSignIn()` if no `userId`. `/api/*` not redirected here. |
| Layouts | `requirePageAuth()` in dashboard + wizard layouts (redirect `/sign-in`). |
| Route Handlers | `requireApiUserId()` → **401** `{ "error": "Unauthorized" }`. |
| Server Actions | `requireActionUser()` → throw `"Unauthorized"` if signed out. |

Helpers live in [`lib/auth.ts`](../../lib/auth.ts).

**Note:** In Clerk 5.0.3, `auth().protect()` for document requests can surface as **404**. Prefer redirect helpers for page UX unless product intentionally wants not-found.

Do not decode session cookies manually. Do not trust client-supplied user ids.

---

## User-specific data isolation

Every Prisma read/write/delete for tenant data **must** include `userId: user.id` (or a unique constraint that embeds `userId`).

Required patterns:

- Category delete via `name_userId_type`.
- Transaction delete: ownership check before aggregate updates.
- Transaction create: category lookup by **`userId` + `name` + `type`**.
- Stats/history APIs: always query with the authenticated `userId`.

---

## Server Actions and APIs

| Rule | Detail |
|------|--------|
| Auth | `requireActionUser` / `requireApiUserId` |
| API response | **401 JSON** for unauthenticated handlers — never HTML redirect |
| Validation | Zod before mutations; UUID for delete transaction ids |
| Errors | Stable client messages (`bad request`, `Unauthorized`); avoid dumping Zod trees |
| CSRF | Next Server Action origin checks; keep Next patched |

Do not introduce new state-changing **GET** endpoints. Existing create-on-GET for user-settings is legacy (BUG-01 / WP5).

---

## Environment variables

**Document names only. Never paste values into markdown, issues, or commits.**

| Name | Side | Purpose |
|------|------|---------|
| `POSTGRES_PRISMA_URL` | Server | Pooled DB |
| `POSTGRES_URL_NON_POOLING` | Server | Direct DB |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | Clerk browser |
| `CLERK_SECRET_KEY` | Server | Clerk server |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `SIGN_UP_URL` / after-sign URLs | Public | Clerk routing |
| `NODE_ENV` | Runtime | Prisma singleton behavior |

`.env` / `.env.local` stay gitignored.

---

## Financial data security

- Do not log full transaction dumps in production.
- Preserve aggregate consistency (`$transaction`).
- Plan money type migration carefully (Float → Decimal/cents) — see [`DATABASE_MIGRATION_PLAN.md`](../modernization/DATABASE_MIGRATION_PLAN.md).
- Export CSV only for the authenticated user’s filtered rows.

---

## Dependency security

- Next is on **14.2.35** (WP1). Residual Next advisories require 15.5+/16 later.
- Re-run `npm audit` after upgrades; do not blindly `npm audit fix --force`.
- Keep React Query Devtools out of production UI.

---

## Checklist for agents (security)

- [ ] Auth check present (`requirePageAuth` / `requireApiUserId` / `requireActionUser`)
- [ ] `userId` filter on every query
- [ ] Zod validation
- [ ] No secrets in client or docs
- [ ] API errors are 401 JSON for unauthenticated callers
- [ ] No new side-effecting GETs
