# WP7 — UX Bugfixes Design

**Date:** 2026-11-27  
**Status:** Approved for implementation  
**Related:** BUG-14, BUG-15, ARCH-02 · [`EXECUTION_PLAN.md`](../../modernization/EXECUTION_PLAN.md)

## Scope

1. **BUG-14** — Emoji Popover in `CreateCategoryDialog`: wire `onOpenChange`; remove manual trigger toggle; close on emoji select.
2. **BUG-15** — `CategoryPicker`: call `onChange` in select/create handlers; remove `useEffect` mirror.
3. **ARCH-02** — Shared `useDateRangeFilter` hook for Overview + Transactions (Approach A).

## Non-goals

WP8 dynamic imports, BUG-16, unused UI cleanup. No git commits unless explicitly requested.
