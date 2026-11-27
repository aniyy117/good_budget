# WP6 — RSC Shells for Manage & Transactions Report

**Date:** 27 November 2026  
**Work package:** WP6  
**Stack:** Next.js 14.2.35 · React 18 · Clerk 5.0.3  

Related: [`EXECUTION_PLAN.md`](./EXECUTION_PLAN.md) · [plan](../superpowers/plans/2026-11-27-wp6-rsc-shells.md) · Audit ARCH-01

---

## 1. Verdict

| Criterion | Result |
|-----------|--------|
| `/manage` page is RSC (no `"use client"`) | **Yes** |
| Manage static header server-rendered | **Yes** |
| Currency + categories isolated in client island | **Yes** (`ManagePageContent`) |
| `/transactions` page is RSC (no `"use client"`) | **Yes** |
| Transactions title server-rendered (children slot) | **Yes** |
| Date range + table isolated in client island | **Yes** (`TransactionsPageContent`) |
| Dashboard layout auth unchanged | **Yes** (`requirePageAuth`) |
| WP6 ready for approval | **Yes** |

**Do not start WP7** until explicitly approved.

---

## 2. Behavior

```text
/manage
  └─ ManagePage (RSC) — title + subtitle
  └─ ManagePageContent (client) — CurrencyComboBox + CategoryList

/transactions
  └─ TransactionsPage (RSC) — title as children
  └─ TransactionsPageContent (client) — DateRangePicker + TransactionTable
```

---

## 3. Files touched

| Path | Change |
|------|--------|
| `app/(dashboard)/manage/page.tsx` | RSC shell |
| `app/(dashboard)/manage/_components/ManagePageContent.tsx` | Client island (moved from page) |
| `app/(dashboard)/transactions/page.tsx` | RSC shell |
| `app/(dashboard)/transactions/_components/TransactionsPageContent.tsx` | Client island |
| Docs listed below | Status |

---

## 4. Verification

| Check | Result |
|-------|--------|
| `npm run lint` | Pass (2 pre-existing date-picker warnings) |
| `npx tsc --noEmit` | Pass (via `next build` typecheck) |
| `npm test` | 12 passed |
| `npm run build` | Pass (`/manage` 3.17 kB, `/transactions` 21.4 kB page) |

---

## 5. Residual

1. QUAL-02 / ARCH-02 — duplicated date-range wiring still exists (WP7).  
2. BUG-14 / BUG-15 — emoji popover / CategoryPicker sync (WP7).  
3. Next when approved: **WP7** UX bugfixes.
