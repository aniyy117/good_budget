# Tech Stack

**Last verified:** 27 November 2026 (post-WP1) against `package.json` / `package-lock.json`.

Related: [`AGENTS.md`](../../AGENTS.md) · [`DEPENDENCY_COMPATIBILITY_REPORT.md`](../modernization/DEPENDENCY_COMPATIBILITY_REPORT.md) · [`WP1_NEXTJS_SECURITY_UPGRADE_REPORT.md`](../modernization/WP1_NEXTJS_SECURITY_UPGRADE_REPORT.md)

---

## Current (production baseline)

| Package | Declared | Locked |
|---------|----------|--------|
| `next` | `14.2.35` | **14.2.35** |
| `react` / `react-dom` | `^18` | **18.3.1** |
| `@clerk/nextjs` | `^5.0.3` | **5.0.3** |
| `@prisma/client` / `prisma` | `^5.13.0` | **5.13.0** |
| `@tanstack/react-query` | `^5.32.1` | **5.32.1** |
| `@tanstack/react-table` | `^8.16.0` | lockfile |
| `zod` | `^3.23.5` | lockfile |
| `typescript` | `^5` | **5.4.5** |
| `eslint` / `eslint-config-next` | `^8` / `14.2.35` | ESLint 8 |
| `tailwindcss` | `^3.4.1` | lockfile |
| `recharts` | `^2.12.6` | charts |
| `@emoji-mart/react` + data | ^1.x | category icons |
| `next-themes` | `^0.3.0` | theming |
| `sonner` | `^1.4.41` | toasts |
| `react-hook-form` + resolvers | forms | |
| Radix / shadcn | many `@radix-ui/*` | UI |

**Database:** PostgreSQL via Prisma env:

- `POSTGRES_PRISMA_URL` (pooled)
- `POSTGRES_URL_NON_POOLING` (direct)

**Auth (runtime env names — values never in git):**

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- Optional Clerk URL helpers as configured in the Clerk dashboard / Vercel project

**Node:** Prefer Node **20 LTS** for local and CI (Next 14 compatible). Confirm Next 16 Node requirements before the major upgrade.

---

## Target (modernization end state)

| Layer | Target direction |
|-------|------------------|
| Next.js | **16.x** (latest patched) |
| React | **19.x** (required by Next 16) |
| Clerk | Current major compatible with Next 16 / React 19 |
| Prisma | Current 5.x or 6.x after compatibility check |
| ESLint | Align with `eslint-config-next` for the chosen Next version |
| Tests | Vitest + Playwright (not installed yet) |

**Recommended upgrade path:**

1. Patch Next **14.2.x ≥ 14.2.35** for security — **Done (WP1: 14.2.35)**.
2. Stage Next 15 (optional intermediate) or jump to 16 with a dedicated branch and full regression — **Pending**.
3. Bump Clerk and peer deps in the same major upgrade window — **Pending**.

See [`DEPENDENCY_COMPATIBILITY_REPORT.md`](../modernization/DEPENDENCY_COMPATIBILITY_REPORT.md) · [`WP1_NEXTJS_SECURITY_UPGRADE_REPORT.md`](../modernization/WP1_NEXTJS_SECURITY_UPGRADE_REPORT.md).

---

## Scripts (current)

```text
dev, build, start, lint, prisma-studio, postinstall (prisma generate)
```

**Missing (planned):** `typecheck`, `test`, `test:e2e`.

---

## Explicit non-goals for stack churn

- Do not add a second state library (Redux, Zustand) without a documented need.
- Do not replace Prisma mid-modernization unless separately approved.
- Do not switch styling systems away from Tailwind/shadcn without approval.
