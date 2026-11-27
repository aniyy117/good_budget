# WP7 — UX Bugfixes Report

**Date:** 27 November 2026  
**Work package:** WP7  
**Stack:** Next.js 14.2.35 · React 18  

Related: [`EXECUTION_PLAN.md`](./EXECUTION_PLAN.md) · [design](../superpowers/specs/2026-11-27-wp7-ux-bugfixes-design.md) · BUG-14, BUG-15, ARCH-02

---

## 1. Verdict

| Criterion | Result |
|-----------|--------|
| Emoji Popover dismiss via `onOpenChange` | **Yes** (BUG-14) |
| CategoryPicker calls `onChange` on select (no effect mirror) | **Yes** (BUG-15) |
| Shared `useDateRangeFilter` used by Overview + Transactions | **Yes** (ARCH-02) |
| WP7 ready for approval | **Yes** |

**Do not start WP8** until explicitly approved. **Do not commit** unless requested.

---

## 2. Changes

| Path | Change |
|------|--------|
| `CreateCategoryDialog.tsx` | `Popover onOpenChange={setIsOpenEmojiPicker}`; remove trigger toggle; close on select |
| `CategoryPicker.tsx` | `selectCategory` → `onChange`; remove `useEffect` |
| `hooks/use-date-range-filter.ts` | Shared max-range toast + state |
| `Overview.tsx` | Uses hook |
| `TransactionsPageContent.tsx` | Uses hook |

---

## 3. Verification

| Check | Result |
|-------|--------|
| `npm run lint` | Pass (2 pre-existing date-picker warnings) |
| `npx tsc --noEmit` | Pass (via `next build` typecheck) |
| `npm test` | 12 passed |
| `npm run build` | Pass |

---

## 4. Residual

Next when approved: **WP8** — dynamic import recharts/emoji-mart; RQ defaults; Devtools dev-only.
