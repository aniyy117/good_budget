# WP10 — Next.js 16 + React 19 + Clerk Upgrade Report

**Date:** 27 November 2026  
**Work package:** WP10  
**Path:** Stage B (Next 15.5.29) → Stage C (Next **16.4.6**)

Related: [`EXECUTION_PLAN.md`](./EXECUTION_PLAN.md) · [plan](../superpowers/plans/2026-11-27-wp10-next16.md)

---

## 1. Verdict

| Criterion | Result |
|-----------|--------|
| Next.js 16 build green | **Yes** — `16.4.6` (Turbopack build) |
| React 19 | **Yes** — `19.2.9` |
| Clerk bumped for Next 15/16 | **Yes** — `@clerk/nextjs@6.39.9` (not Core 3 / v7) |
| `auth()` awaited (async) | **Yes** — `lib/auth.ts`, `proxy.ts`, API routes, layouts |
| Middleware → `proxy.ts` | **Yes** (Next 16 convention) |
| `next lint` → ESLint CLI | **Yes** — `eslint .` + `eslint.config.mjs` |
| Zod for eslint-config-next | **Yes** — bumped to **zod@4** (schemas still pass tests) |
| Manual smoke | **Pending user** (sign-in → wizard → CRUD) |
| WP10 ready for approval | **Yes** (commit when requested) |

**Do not start WP11** until explicitly approved.

---

## 2. Stack delta

| Package | Before | After |
|---------|--------|-------|
| `next` | 14.2.35 | **16.4.6** |
| `react` / `react-dom` | 18.3.1 | **19.2.9** |
| `@clerk/nextjs` | 5.0.3 | **6.39.9** |
| `eslint` | 8.x | **9.x** |
| `eslint-config-next` | 14.2.35 | **16.4.6** |
| `zod` | 3.x | **4.x** |

---

## 3. Code changes (summary)

- `await auth()` in page/API helpers; async `requirePageAuth` / `requireApiUserId`
- `middleware.ts` → `proxy.ts`
- React 19 `useRef` initial args; `JSX.Element` → `React.JSX.Element`
- cmdk children cast for nested `@types/react`
- Lint script + flat config (`core-web-vitals`; stricter `next/typescript` deferred)

---

## 4. Verification

| Check | Result |
|-------|--------|
| `npm test` | 12 passed |
| `npm run build` | Pass (Next 16.4.6) |
| `npm run lint` | Pass with pre-existing date-picker / hook warnings (vitals config) |

---

## 5. Residual

1. Enable `eslint-config-next/typescript` after cleaning shadcn empty-interface / set-state-in-effect noise.  
2. Optional Clerk **v7** Core 3 later (`npx @clerk/upgrade`) — not required for Next 16.  
3. `@emoji-mart/react` peer still declares React ≤18 — install used `--legacy-peer-deps`.  
4. Next: **WP11** tests + CI when approved.
