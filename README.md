# GoodBudget

Personal finance tracker: income and expenses, categories, overview stats, history charts, and a filterable transactions table.

## Stack (current)

- **Next.js 14.2.3** (App Router) · **React 18** · **TypeScript**
- **Clerk** authentication
- **Prisma** + **PostgreSQL**
- **TanStack Query** · **Zod** · **Tailwind CSS** · **shadcn/ui**

**Modernization target:** Next.js **16** (phased). See [docs/modernization/MODERNIZATION_ROADMAP.md](docs/modernization/MODERNIZATION_ROADMAP.md).

## AI / contributor instructions

**Start here:** [AGENTS.md](AGENTS.md)

| Doc | Purpose |
|-----|---------|
| [docs/audit/NEXTJS_APPLICATION_AUDIT.md](docs/audit/NEXTJS_APPLICATION_AUDIT.md) | Full technical audit |
| [docs/architecture/](docs/architecture/) | Architecture, stack, standards, security, testing |
| [docs/modernization/](docs/modernization/) | Roadmap, execution plan, risks, DB migration plan |

## Getting started

### Prerequisites

- Node.js **20 LTS** recommended
- PostgreSQL database (e.g. Vercel Postgres / Neon)
- Clerk application credentials

### Install

```bash
npm ci
```

`postinstall` runs `prisma generate`.

### Environment

Create `.env.local` (gitignored) with at least:

```bash
# Database (names only — fill with your values)
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

Optional: `vercel link` then `vercel env pull .env.local` if the project is linked on Vercel.

### Develop

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run prisma-studio` | Prisma Studio |

## App routes

| Path | Description |
|------|-------------|
| `/sign-in`, `/sign-up` | Clerk auth |
| `/wizard` | Currency onboarding |
| `/` | Dashboard overview + history |
| `/transactions` | Transaction table |
| `/manage` | Currency + categories |

## License

Private project (`package.json` `"private": true`).
