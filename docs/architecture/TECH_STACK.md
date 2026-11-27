# Tech Stack

**Last verified:** 27 November 2026 (post-WP10) against `package.json` / `package-lock.json`.

Related: [`AGENTS.md`](../../AGENTS.md) · [`DEPENDENCY_COMPATIBILITY_REPORT.md`](../modernization/DEPENDENCY_COMPATIBILITY_REPORT.md) · [`WP10_NEXTJS16_UPGRADE_REPORT.md`](../modernization/WP10_NEXTJS16_UPGRADE_REPORT.md)

---

## Current (production baseline)

| Package | Declared / locked |
|---------|-------------------|
| `next` | **16.4.6** |
| `react` / `react-dom` | **19.2.9** |
| `@clerk/nextjs` | **6.39.9** |
| `@prisma/client` / `prisma` | **5.13.0** |
| `@tanstack/react-query` | **5.32.1** |
| `zod` | **4.x** |
| `typescript` | **5.x** |
| `eslint` / `eslint-config-next` | **9.x** / **16.4.6** |
| `tailwindcss` | **3.4.x** |
| `recharts` | charts (dynamic import) |
| `@emoji-mart/react` + data | lazy-loaded on open |
| `next-themes` / `sonner` / RHF | theming / toasts / forms |
| Radix / shadcn | UI |

**Database:** PostgreSQL via Prisma env:

- `POSTGRES_PRISMA_URL` (pooled)
- `POSTGRES_URL_NON_POOLING` (direct)

**Auth (runtime env names — values never in git):**

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- Optional Clerk URL helpers as configured in the Clerk dashboard / Vercel project

**Optional FX:** `FX_API_BASE_URL`

**Node:** Prefer Node **26 LTS** (`engines.node`: `26.x`, `.nvmrc`). Node 20 is EOL.

**Lint:** `npm run lint` → `eslint .` (flat `eslint.config.mjs`). `next lint` removed in Next 16.

**Request interception:** [`proxy.ts`](../../proxy.ts) (Next 16; formerly `middleware.ts`).

---

## Target residual

| Item | Notes |
|------|-------|
| Clerk Core 3 / `@clerk/nextjs` v7 | Optional later (`npx @clerk/upgrade`) |
| Money `Float` → Decimal | WP12 |
| Tests + CI | WP11 |
