# Coding Standards

**Normative for new and modified code.** Existing code may not fully match; improve opportunistically within task scope — no drive-by mass renames.

Related: [`AGENTS.md`](../../AGENTS.md) · [`APPLICATION_ARCHITECTURE.md`](./APPLICATION_ARCHITECTURE.md)

---

## TypeScript

- Keep `strict: true` in `tsconfig.json`.
- Prefer explicit types at module boundaries; use Zod inference (`z.infer<>`) for forms and actions.
- Avoid `any`. Prefer proper types or `unknown` + narrowing.
- Use `import type` for type-only imports (especially when importing from `app/api/**/route.ts`).
- Prefer `string` over boxed `String`.

---

## Naming

| Kind | Convention | Example |
|------|------------|---------|
| React components | PascalCase | `CreateTransactionDialog` |
| New functions / Server Actions | camelCase | `createTransaction` |
| Legacy Server Actions | PascalCase (existing) | `CreateTransaction` — leave until deliberate rename |
| Files (components) | PascalCase or match export | `StatsCards.tsx` |
| Zod schemas | PascalCase + Schema | `CreateTransactionSchema` |
| Query keys | lowercase string arrays | `["overview", "stats", from, to]` |
| Route segments | kebab-case folders | already App Router style |

Layouts/pages historically use lowercase `function layout` / `function page` — acceptable; prefer descriptive names for non-default exports (`TransactionsPage`).

---

## Components

- Default to Server Components.
- `"use client"` only when hooks, browser APIs, or event handlers require it.
- Prefer composing small client islands inside server pages.
- Reuse shadcn primitives from `components/ui/`; do not fork unless necessary.
- Do not add new unused shadcn modules “just in case.”
- Extract duplicated UI (date-range wiring, delete confirmations) when touching those areas.

---

## Forms and validation

- `react-hook-form` + `@hookform/resolvers/zod` for dialogs.
- Shared schemas live in `schema/` and are reused in Server Actions.
- Never trust client-only validation; always re-validate on the server.

---

## Data and side effects

- Mutations: Server Actions.
- Client reads: TanStack Query with coherent keys and invalidation.
- Browser GETs to `/api/*` must use [`lib/api.ts`](../../lib/api.ts) `apiGet` (checks `res.ok`; throws `ApiError`).
- Handle mutation `onError` (same toast `id` as loading) so Sonner toasts do not stick.
- After mutations, invalidate related keys (`overview`, `transactions`, `categories`, `userSettings`).
- No `console.log` in render paths for production features.

---

## Errors and UX

- User-facing errors via Sonner toasts (already used).
- Prefer stable error messages over dumping Zod trees to the client.
- Add `loading.tsx` / `error.tsx` when implementing route-level UX work.

---

## What to avoid

- Unrelated refactors in feature PRs.
- New abstractions with a single call site.
- Copy-pasting Prisma queries without `userId` filters.
- Importing Server-only modules into client components except via Server Actions / `import type`.
- Editing `package.json` dependencies unless the task is an approved upgrade.

---

## Formatting and lint

- Follow ESLint (`next/core-web-vitals`).
- Do not disable lint rules without a short comment and task justification.
- Match existing Tailwind utility style in nearby files.
