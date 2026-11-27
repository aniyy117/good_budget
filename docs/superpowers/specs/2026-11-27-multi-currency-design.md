# Multi-Currency Transactions — Design Spec

**Date:** 2026-11-27  
**Status:** Implemented (27 November 2026) — see [`WP_MULTI_CURRENCY_REPORT.md`](../../modernization/WP_MULTI_CURRENCY_REPORT.md)  
**Product:** GoodBudget  
**Related:** [`DATABASE_MIGRATION_PLAN.md`](../../modernization/DATABASE_MIGRATION_PLAN.md) · [`EXECUTION_PLAN.md`](../../modernization/EXECUTION_PLAN.md) · WP5 onboarding (base currency)

---

## 1. Problem

Amounts are stored as bare `Float` values. `UserSettings.currency` only changes the **display formatter**. Changing INR → USD makes `94000` appear as `$94,000` with no conversion. That is incorrect once the product supports more than one currency.

---

## 2. Goals

1. Each transaction records the currency the user entered.
2. Dashboard totals and history stay consistent in a single **base (home) currency**.
3. Changing base currency must not silently relabel historical amounts as a different currency.
4. Fit the existing `MonthHistory` / `YearHistory` aggregate model without converting on every chart load.

### Non-goals (this feature)

- Full historical “rebase” of all `amountInBase` when base currency changes (optional later).
- Migrating `Float` → `Decimal` / integer cents (WP12).
- Editing transaction currency after create (follow-up).
- Unlimited FX pairs beyond the existing allowlist.

---

## 3. Chosen approach

**Per-transaction original amount + base snapshot at write time.**

| Field | Required | Purpose |
|-------|----------|---------|
| `amount` | Yes | Value as entered |
| `currency` | Yes | ISO code of entered value |
| `amountInBase` | Yes | Value in user’s base currency at save time |
| `fxRate` | Yes | Rate used: `amountInBase = amount * fxRate` (units of base per 1 unit of tx currency) |
| `fxRateAt` | Yes | When the rate was obtained |

**Why not lean (amount + currency only)?**  
Overview and history aggregates would need FX on every read and conflict with float history tables. Snapshot keeps aggregates fast and stable.

**Why not convert-all-on-currency-change?**  
Destroys original meaning; not true multi-currency; bad rates for mixed history.

---

## 4. Data model

### `UserSettings`

- Keep `currency` as the **base / reporting** currency (wizard + manage).
- Semantics change: it is no longer “the only currency of all amounts”; it is the home currency for totals and the default for new transactions.

### `Transaction` (additions)

```text
currency     String    // allowlist: INR, USD, EUR, JPY, GBP
amountInBase Float     // same numeric type as amount for now
fxRate       Float
fxRateAt     DateTime
```

Existing fields (`amount`, category fields, etc.) remain.

### History aggregates

- Continue to store income/expense in **base currency only**.
- Create/delete paths increment/decrement using **`amountInBase`**, not `amount`.

### Backfill (existing rows)

For each transaction belonging to a user:

- `currency` ← that user’s current `UserSettings.currency`
- `amountInBase` ← `amount`
- `fxRate` ← `1`
- `fxRateAt` ← `createdAt` (or migration timestamp)

Assumption: historical amounts were entered in the user’s then-current settings currency (matches prior product behavior).

**Prerequisite:** database backup before migration (financial data).

---

## 5. Product / UI behavior

### Base currency (wizard / manage)

- User selects base currency as today.
- If transactions already exist, show a warning before change: existing transactions keep their stored originals and `amountInBase`; only **new** transactions use the new base for snapshotting.
- v1 does **not** recompute old `amountInBase` values.

### Create transaction

- Inputs: amount, description, date, category, **currency** (default = base).
- Server resolves FX, writes snapshot fields, updates history with `amountInBase`.

### Transactions table

- Primary display: original amount formatted with transaction `currency` (e.g. `₹94,000`).
- When `currency !== base`, show base equivalent (e.g. `≈ $1,120`) using stored `amountInBase` (not a live re-quote).

### Overview / History

- Unchanged UX; all sums remain in base currency via history / `amountInBase`.

### Delete transaction

- History decrements use `amountInBase`.

---

## 6. FX rates, flow, and errors

### Rate source

- Server-only lookup (never trust client-supplied rates).
- Cache by `(from, to, day)` with short TTL.
- Same currency → `fxRate = 1`, no network call.
- Document env var **name** only (e.g. `FX_API_KEY`); never commit secrets.

### Write path

```text
Client → Server Action (Zod)
  → requireActionUser
  → load baseCurrency
  → resolve fxRate (cache → provider)
  → amountInBase = amount * fxRate
  → Prisma $transaction: Transaction + MonthHistory/YearHistory (amountInBase)
```

### Errors

- Unknown currency → reject (`bad request`).
- FX unavailable → fail mutation; toast: could not fetch exchange rate; **do not** save with a guessed rate.
- Auth: existing `requireActionUser` / API auth unchanged.

---

## 7. Testing

- Same-currency: `fxRate = 1`, `amountInBase = amount`.
- Cross-currency: mocked FX client; assert `amountInBase` and history deltas.
- Zod rejects currencies outside allowlist.
- Delete decrements history by `amountInBase`.
- Backfill smoke: existing rows get `currency = settings.currency`, `fxRate = 1`.

---

## 8. Rollout sequencing

1. Schema migration + backfill (after backup).
2. FX helper module + wiring into `CreateTransaction` / `DeleteTransaction`.
3. UI: currency picker on create; dual display on transactions table; warning on base change.
4. Docs: architecture, security (env names), execution plan entry for this WP.

**Do not** fold into WP6 (RSC shells). Treat as a dedicated multi-currency work package after WP5. WP12 (Decimal) remains separate.

---

## 9. Success criteria

- ₹94,000 entered with base USD stores INR original **and** a converted `amountInBase`.
- Changing base currency does not display old INR amounts as dollars without conversion.
- Overview/history remain coherent in base currency.
- FX failure blocks save rather than corrupting totals.

---

## 10. Open follow-ups (explicitly deferred)

- Optional one-click rebase of all `amountInBase` when base changes.
- Per-transaction currency edit.
- `Decimal` / integer minor units (WP12).
- Provider choice finalization during implementation plan (must meet: server-side, cacheable, allowlisted pairs).
