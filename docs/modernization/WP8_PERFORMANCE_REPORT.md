# WP8 — Performance Report

**Date:** 27 November 2026  
**Work package:** WP8  
**Stack:** Next.js 14.2.35 · React 18 · TanStack Query 5  

Related: [`EXECUTION_PLAN.md`](./EXECUTION_PLAN.md) · [plan](../superpowers/plans/2026-11-27-wp8-performance.md) · PERF-01, PERF-02

---

## 1. Verdict

| Criterion | Result |
|-----------|--------|
| Recharts behind `next/dynamic` | **Yes** (`HistoryChart`) |
| Emoji-mart lazy-loaded on picker open | **Yes** (`EmojiPickerPanel`) |
| QueryClient `staleTime: 60_000` | **Yes** |
| Devtools development-only | **Yes** (dynamic + NODE_ENV gate) |
| First Load JS on `/` improved | **Yes** — **426 kB → 221 kB** |
| WP8 ready for approval | **Yes** |

**Do not start WP9** until explicitly approved. **Do not commit** unless requested.

---

## 2. Build comparison

| Route | Before (approx) | After |
|-------|-----------------|-------|
| `/` First Load | 426 kB | **221 kB** |
| `/` page | 112 kB | **15.3 kB** |
| `/manage` First Load | 294 kB | **185 kB** |

---

## 3. Files

| Path | Change |
|------|--------|
| `RootProviders.tsx` | staleTime + Devtools gate |
| `History.tsx` | dynamic `HistoryChart` |
| `HistoryChart.tsx` | recharts island |
| `EmojiPickerPanel.tsx` | lazy emoji-mart |
| `CreateCategoryDialog.tsx` | uses panel |

---

## 4. Verification

| Check | Result |
|-------|--------|
| `npm run lint` | Pass (2 pre-existing date-picker warnings) |
| `npx tsc --noEmit` | Pass |
| `npm test` | 12 passed |
| `npm run build` | Pass |

---

## 5. Residual

Next when approved: **WP9** — `Transaction(userId, date)` index; optional `updateAt` → `updatedAt`.
