# GoodBudget — AGENTS.md

**Primary instruction manual for all AI coding agents** (Cursor, Claude Code, Copilot, Codex, and others).

Read this file **before** modifying any application or documentation code. For deep detail, follow the linked docs — do not invent architecture that contradicts them.

---

## 0. Mandatory preamble

1. Read this file and the relevant docs under [`docs/`](docs/) for the task at hand.
2. Verify assumptions against the **actual** repository (`package.json`, `app/`, `prisma/`), not outdated memory.
3. Distinguish **Current (Next.js 14.2.35)** from **Target (Next.js 16)**. Next 16 is the modernization goal; it is **not** the running stack until upgrades land.
4. Prefer incremental modernization over rewrites. Preserve authentication, UX, and financial data integrity.
5. Do not expose secrets. Document env **names** only. Never commit `.env`, `.env.local`, or credentials.
6. Scope discipline: if the user asked for docs-only or a single phase, do not expand into unrelated refactors.

---

## 1. Project understanding

### Purpose

GoodBudget is a personal finance tracker: record income and expenses, organize categories, view overview stats, history charts, and a filterable transaction table with CSV export.

### Major features

| Feature | Routes / entry |
|---------|----------------|
| Auth (Clerk) | `/sign-in`, `/sign-up` |
| Currency onboarding | `/wizard` |
| Dashboard overview + history | `/` |
| Transactions history + delete + CSV | `/transactions` |
| Manage currency + categories | `/manage` |

### Technology stack (current, locked)

| Layer | Technology | Locked version (approx.) |
|-------|------------|--------------------------|
| Framework | Next.js App Router | **14.2.35** |
| UI | React | **18.3.1** |
| Auth | `@clerk/nextjs` | **5.0.3** |
| ORM / DB | Prisma + PostgreSQL | **5.13.0** |
| Client data | TanStack Query | **5.32.1** |
| Validation | Zod | **3.x** |
| Styling | Tailwind CSS + shadcn/ui | **3.4.x** |

Full matrix: [`docs/architecture/TECH_STACK.md`](docs/architecture/TECH_STACK.md).

### Architecture (current)

```text
Browser
  └─ RootLayout (ClerkProvider + Theme + React Query)
       ├─ (auth) sign-in / sign-up
       ├─ wizard (RSC + client currency picker)
       ├─ (dashboard) Navbar + pages
       │    ├─ /              RSC auth/settings gate + CSR Overview/History
       │    ├─ /transactions  full CSR page
       │    └─ /manage        full CSR page
       └─ /api/*              GET Route Handlers (Prisma + Clerk)

Writes: Client → Server Actions → Prisma (+ MonthHistory / YearHistory aggregates)
Reads:  Client → React Query → apiGet → GET /api/* → Prisma
```

Details: [`docs/architecture/APPLICATION_ARCHITECTURE.md`](docs/architecture/APPLICATION_ARCHITECTURE.md).

### Authentication and authorization (current — post WP2)

- Clerk via `ClerkProvider` and [`middleware.ts`](middleware.ts): public `/sign-in`/`/sign-up`; private pages use `redirectToSignIn()`.
- Shared helpers in [`lib/auth.ts`](lib/auth.ts): `requirePageAuth`, `requireApiUserId` (401 JSON), `requireActionUser`.
- Dashboard and wizard layouts re-check auth (defense in depth).
- Data isolation: Prisma queries must always filter by Clerk `user.id` (category lookups include `type`).

See [`docs/architecture/SECURITY_GUIDELINES.md`](docs/architecture/SECURITY_GUIDELINES.md) · [`docs/modernization/WP2_AUTHENTICATION_AUTHORIZATION_REPORT.md`](docs/modernization/WP2_AUTHENTICATION_AUTHORIZATION_REPORT.md).

### Database and data access

- Schema: [`prisma/schema.prisma`](prisma/schema.prisma) — `UserSettings`, `Category`, `Transaction`, `MonthHistory`, `YearHistory`.
- Client singleton: [`lib/prisma.ts`](lib/prisma.ts).
- Zod schemas: [`schema/`](schema/).
- Money currently stored as `Float` (known risk — migrate carefully per DB plan).

### Modernization objectives

Phased path to **Next.js 16** without a full rewrite. Status and phases: [`docs/modernization/MODERNIZATION_ROADMAP.md`](docs/modernization/MODERNIZATION_ROADMAP.md).  
Ordered work: [`docs/modernization/EXECUTION_PLAN.md`](docs/modernization/EXECUTION_PLAN.md).  
Audit findings (issue IDs): [`docs/audit/NEXTJS_APPLICATION_AUDIT.md`](docs/audit/NEXTJS_APPLICATION_AUDIT.md).

---

## 2. Architecture guidelines

### App Router

- Keep the App Router. No Pages Router.
- Route groups: `(auth)`, `(dashboard)`; feature folders `_components`, `_actions`.
- On Next 16 upgrades, follow official migration notes (e.g. middleware → proxy naming if required). Until then, keep [`middleware.ts`](middleware.ts).

### Server vs Client Components

- Default to **Server Components**.
- Add `"use client"` only for interactivity (forms, charts, theme, pathname, React Query).
- Prefer RSC page shells + client islands over full-page `"use client"` (especially `/manage`, `/transactions`).

### Server Actions vs Route Handlers

- **Mutations:** Server Actions (`"use server"`) with Zod validation.
- **Reads:** Today via GET Route Handlers + React Query (`lib/api.ts` `apiGet`). Prefer server-side fetches where they reduce waterfalls, without breaking UX.
- Do not add POST API routes that duplicate existing Server Actions without reason.

### Data fetching and caching

- Configure React Query defaults (`staleTime`, sensible refetch) when touching providers.
- Invalidate related query keys after mutations (`overview`, `transactions`, `history`, `categories`, `userSettings`).
- Avoid side-effecting GET handlers (e.g. create-on-GET for user settings).

### Shared business logic

- Validation: [`schema/`](schema/).
- Helpers/types: [`lib/`](lib/).
- Do not copy Zod schemas into components.

### Error and loading states

- Add `loading.tsx` / `error.tsx` for dashboard segments when implementing UX work.
- API auth failures: return **401 JSON**, not `redirect("/sign-in")`, for fetch clients.
- Mutations: always handle `onError` (toasts must not stick on failure).

---

## 3. Coding standards

Full detail: [`docs/architecture/CODING_STANDARDS.md`](docs/architecture/CODING_STANDARDS.md).

- TypeScript: keep `strict: true`. Avoid `any`; prefer `import type`.
- New functions: `camelCase` (`createTransaction`). Existing PascalCase Server Actions may remain until a deliberate rename; do not mass-rename in unrelated PRs.
- Prefer reuse (date-range controls, delete dialogs) over duplication.
- No unnecessary abstractions or drive-by refactors outside the task.
- Match existing folder and shadcn patterns.

---

## 4. Security guidelines

Full detail: [`docs/architecture/SECURITY_GUIDELINES.md`](docs/architecture/SECURITY_GUIDELINES.md).

- Authenticate every Server Action and Route Handler; authorize with `userId`.
- Validate all inputs with Zod (including delete IDs).
- Filter categories by **name + type** when creating transactions.
- Never put secrets in client bundles or docs.
- Upgrade Next promptly when doing dependency work (14.2.3 has known CVEs; see audit SEC-01).
- Treat financial amounts and aggregates as sensitive integrity data.

---

## 5. Database guidelines

Full detail: [`docs/modernization/DATABASE_MIGRATION_PLAN.md`](docs/modernization/DATABASE_MIGRATION_PLAN.md).

- Use the Prisma singleton; use `$transaction` when updating transactions + history aggregates together.
- Prefer `Decimal` or integer cents for money when migrating (decision recorded in DB plan).
- Add indexes (e.g. `Transaction(userId, date)`) with explicit migrations.
- Backup / verify rollback before production schema changes.
- Never run destructive migrations without explicit user approval.

---

## 6. Performance guidelines

- Dynamic-import heavy client libs (`recharts`, emoji-mart) when touching those files.
- Gate React Query Devtools to development only.
- Watch First Load JS on `/` (audit measured ~426 kB).
- Prefer server data for initial paint where practical.
- Aim to improve LCP / INP / TBT; measure when claiming wins.

---

## 7. Testing guidelines

Full detail: [`docs/architecture/TESTING_STRATEGY.md`](docs/architecture/TESTING_STRATEGY.md).

**Current state:** no unit/E2E tests or CI workflows.

Before reporting completion on code changes:

1. `npm run lint`
2. `npm run build` (or `npx tsc --noEmit` when a `typecheck` script exists)
3. Manually exercise affected flows when UI/auth/data paths change

When adding tests: Vitest for schema/actions; Playwright for auth → wizard → CRUD smoke.

---

## 8. AI agent behaviour (required)

Every agent must:

1. Read `AGENTS.md` and relevant docs before editing.
2. Understand existing code before proposing replacements.
3. Explain the implementation approach briefly.
4. List affected files and potential risks.
5. Preserve existing functionality unless the task explicitly changes it.
6. Avoid unrelated modifications (no opportunistic dependency upgrades unless requested).
7. Verify changes (lint/build/tests as applicable) before claiming done.
8. Update docs under `docs/` when architecture, stack, or phase status changes.
9. Cross-link audit issue IDs (`SEC-01`, `BUG-02`, etc.) when fixing them; mark roadmap status when phases complete.

---

## 9. Documentation index

| Document | Purpose |
|----------|---------|
| [docs/audit/NEXTJS_APPLICATION_AUDIT.md](docs/audit/NEXTJS_APPLICATION_AUDIT.md) | Full audit + issue IDs |
| [docs/modernization/MODERNIZATION_ROADMAP.md](docs/modernization/MODERNIZATION_ROADMAP.md) | Phases and status |
| [docs/modernization/PHASE_0_BASELINE_REPORT.md](docs/modernization/PHASE_0_BASELINE_REPORT.md) | Phase 0 verified baseline |
| [docs/modernization/WP1_NEXTJS_SECURITY_UPGRADE_REPORT.md](docs/modernization/WP1_NEXTJS_SECURITY_UPGRADE_REPORT.md) | WP1 Next 14.2.35 security patch |
| [docs/modernization/WP2_AUTHENTICATION_AUTHORIZATION_REPORT.md](docs/modernization/WP2_AUTHENTICATION_AUTHORIZATION_REPORT.md) | WP2 auth hardening |
| [docs/modernization/EXECUTION_PLAN.md](docs/modernization/EXECUTION_PLAN.md) | Ordered work packages |
| [docs/modernization/DEPENDENCY_COMPATIBILITY_REPORT.md](docs/modernization/DEPENDENCY_COMPATIBILITY_REPORT.md) | Next 14 → 16 compatibility |
| [docs/modernization/MIGRATION_RISK_ASSESSMENT.md](docs/modernization/MIGRATION_RISK_ASSESSMENT.md) | Risks and mitigations |
| [docs/modernization/DATABASE_MIGRATION_PLAN.md](docs/modernization/DATABASE_MIGRATION_PLAN.md) | Schema/data migration plan |
| [docs/architecture/APPLICATION_ARCHITECTURE.md](docs/architecture/APPLICATION_ARCHITECTURE.md) | Current vs target architecture |
| [docs/architecture/TECH_STACK.md](docs/architecture/TECH_STACK.md) | Versions |
| [docs/architecture/CODING_STANDARDS.md](docs/architecture/CODING_STANDARDS.md) | Coding norms |
| [docs/architecture/SECURITY_GUIDELINES.md](docs/architecture/SECURITY_GUIDELINES.md) | Security norms |
| [docs/architecture/TESTING_STRATEGY.md](docs/architecture/TESTING_STRATEGY.md) | Testing plan |

Root stub (redirect only): [NEXTJS_APPLICATION_AUDIT.md](NEXTJS_APPLICATION_AUDIT.md).
