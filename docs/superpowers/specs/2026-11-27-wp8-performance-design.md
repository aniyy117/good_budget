# WP8 — Performance (dynamic imports + RQ defaults)

**Date:** 2026-11-27  
**Status:** Approved / implementing  
**Audit:** PERF-01, PERF-02  
**Related:** [`EXECUTION_PLAN.md`](../../modernization/EXECUTION_PLAN.md)

## Goals

1. Cut First Load JS on `/` by code-splitting **recharts** and **emoji-mart**.
2. Sensible React Query defaults (`staleTime`).
3. Ship React Query Devtools **only in development**.

## Approach (recommended)

| Item | Approach |
|------|----------|
| Recharts | Extract chart body to `HistoryChart.tsx`; load via `next/dynamic(..., { ssr: false })` from `History.tsx` |
| Emoji-mart | Dynamic-import `@emoji-mart/react` + data only when emoji Popover opens (or when dialog mounts picker) |
| QueryClient | `defaultOptions.queries.staleTime: 60_000` (1 min) |
| Devtools | `process.env.NODE_ENV === "development" && <ReactQueryDevtools />` (or `next/dynamic` gated to dev) |

## Non-goals

WP9 indexes, WP10 Next 16, unused shadcn trim, fixing date-range-picker eslint warnings.

## Exit

- Measurable drop or stable split of `/` First Load vs baseline ~426 kB (chart/emoji not in initial graph).
- Devtools absent from production client path.
- Lint / tsc / test / build green.
- **No commits** unless requested.
