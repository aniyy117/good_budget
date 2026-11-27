# WP-MC — Multi-Currency Transactions Report

**Date:** 27 November 2026  
**Work package:** WP-MC (pulled forward after WP5)  
**Stack:** Next.js 14.2.35 · Clerk 5.0.3 · Prisma 5.13  

Related: [`EXECUTION_PLAN.md`](./EXECUTION_PLAN.md) · [design spec](../superpowers/specs/2026-11-27-multi-currency-design.md) · [implementation plan](../superpowers/plans/2026-11-27-multi-currency.md)

---

## 1. Verdict

| Criterion | Result |
|-----------|--------|
| Transaction stores `currency`, `amountInBase`, `fxRate`, `fxRateAt` | **Yes** |
| Existing rows backfilled from user base | **Yes** (migration) |
| Create snapshots FX server-side; fail closed | **Yes** (`lib/fx.ts`) |
| History aggregates use `amountInBase` | **Yes** (create + delete) |
| Create UI currency field (default = base) | **Yes** |
| Table dual display when currencies differ | **Yes** |
| Manage warns before base currency change | **Yes** |
| No historical rebase / no Decimal migration | **Yes** (explicit non-goals) |
| WP-MC ready for approval | **Yes** |

**Do not start WP6** until explicitly approved.

---

## 2. Behavior

```text
Create transaction
  └─ amount + currency (Zod allowlist)
  └─ server FX → amountInBase / fxRate / fxRateAt
  └─ MonthHistory / YearHistory += amountInBase

Transactions table
  └─ primary: format(amount, transaction.currency)
  └─ if ≠ base: ≈ format(amountInBase, userSettings.currency)

Change base (Manage)
  └─ confirm warning → UpdateUserCurrency
  └─ existing amountInBase unchanged; new txs use new base
```

---

## 3. Files touched (summary)

| Area | Paths |
|------|--------|
| Schema | `prisma/schema.prisma`, migration `20261127105242_transaction_multi_currency` |
| FX | `lib/fx.ts`, `lib/__tests__/fx.test.ts` |
| Actions / Zod | `schema/transaction.ts`, create/delete transaction actions |
| UI | `CreateTransactionDialog.tsx`, `TransactionTable.tsx`, `CurrencyComboBox.tsx`, manage page |
| API | `app/api/transactions-history/route.ts` |
| Docs | architecture, security env, execution plan, this report |

---

## 4. Verification

| Check | Result |
|-------|--------|
| `npm run lint` | Pass (2 pre-existing date-picker warnings) |
| `npx tsc --noEmit` | Pass (via `next build` typecheck) |
| `npm test` | 12 passed (4 FX + 8 security-validation) |
| `npm run build` | Pass |

---

## 5. Residual / follow-ups

1. Float → Decimal / cents remains **WP12**.  
2. Optional historical rebase when base currency changes — not in v1.  
3. Edit transaction currency after create — not in v1.  
4. Next numbered package when approved: **WP6** RSC shells for manage/transactions.
