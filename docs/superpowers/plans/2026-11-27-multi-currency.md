# Multi-Currency Transactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store each transaction’s original currency plus a base-currency snapshot so dashboard totals stay coherent and changing base currency no longer silently relabels historical amounts.

**Architecture:** Extend `Transaction` with `currency`, `amountInBase`, `fxRate`, `fxRateAt`. Server Action resolves FX (Frankfurter, no API key required for allowlisted pairs; in-memory day cache), writes snapshot fields, and updates `MonthHistory`/`YearHistory` using `amountInBase`. UI adds currency on create and dual display on the transactions table; base-currency change shows a warning only.

**Tech Stack:** Next.js 14.2.35 App Router, Prisma 5.13 + PostgreSQL, Zod, TanStack Query, Vitest, Frankfurter FX API (`https://api.frankfurter.app`).

**Spec:** [`docs/superpowers/specs/2026-11-27-multi-currency-design.md`](../specs/2026-11-27-multi-currency-design.md)

## Global Constraints

- Do not migrate `Float` → `Decimal` (WP12).
- Do not rebase historical `amountInBase` when base currency changes (v1).
- Never trust client-supplied FX rates.
- On FX failure, abort the mutation — do not save with a guessed rate.
- Never commit secrets; Frankfurter needs no key (document optional `FX_API_BASE_URL` name only if overridden).
- Preserve Clerk auth helpers (`requireActionUser`, `requireApiUserId`).
- Backup DB before applying the production migration.
- Keep this work separate from WP6 RSC shells.
- Currency allowlist remains `INR | USD | EUR | JPY | GBP` from `lib/currencies.ts`.

## File map

| File | Responsibility |
|------|----------------|
| `prisma/schema.prisma` | Add transaction FX fields |
| `prisma/migrations/...` | Migration + SQL backfill |
| `lib/types.ts` | Extend `Transaction` type |
| `lib/fx.ts` | `getFxRate(from, to, at): Promise<number>` + cache |
| `lib/__tests__/fx.test.ts` | FX helper unit tests |
| `schema/transaction.ts` | Add `currency` to create schema |
| `lib/__tests__/security-validation.test.ts` | Currency validation cases |
| `app/(dashboard)/_actions/transactions.ts` | Snapshot + history via `amountInBase` |
| `app/(dashboard)/transactions/_actions/deleteTransaction.ts` | Decrement via `amountInBase` |
| `app/(dashboard)/_components/CreateTransactionDialog.tsx` | Currency field |
| `app/(dashboard)/transactions/_components/TransactionTable.tsx` | Dual amount display |
| `components/common/CurrencyComboBox.tsx` | Base-change warning when txs exist |
| `docs/architecture/*`, `EXECUTION_PLAN.md` | Document WP |

---

### Task 1: Schema + backfill migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_transaction_multi_currency/migration.sql` (via `prisma migrate`)
- Modify: `lib/types.ts`

**Interfaces:**
- Produces: Prisma `Transaction` columns `currency`, `amountInBase`, `fxRate`, `fxRateAt`
- Produces: `lib/types.ts` `Transaction` matching those fields

- [ ] **Step 1: Update Prisma model**

In `prisma/schema.prisma`, under `model Transaction`, after `amount`, add:

```prisma
  currency     String   @default("INR")
  amountInBase Float    @default(0)
  fxRate       Float    @default(1)
  fxRateAt     DateTime @default(now())
```

(Defaults exist only so migrate can add non-null columns; backfill overwrites them.)

- [ ] **Step 2: Create migration with backfill SQL**

Run (after confirming backup / local DB available):

```bash
npx prisma migrate dev --name transaction_multi_currency --create-only
```

Edit the generated `migration.sql` to append backfill **after** column adds:

```sql
-- Backfill: treat existing amounts as already in the user's settings currency
UPDATE "Transaction" AS t
SET
  "currency" = COALESCE(us."currency", 'INR'),
  "amountInBase" = t."amount",
  "fxRate" = 1,
  "fxRateAt" = t."createdAt"
FROM "UserSettings" AS us
WHERE us."userId" = t."userId";

UPDATE "Transaction"
SET
  "currency" = 'INR',
  "amountInBase" = "amount",
  "fxRate" = 1,
  "fxRateAt" = "createdAt"
WHERE "currency" IS NULL OR "amountInBase" = 0 AND "fxRate" = 1 AND "amount" <> 0;
```

(Prefer the first UPDATE only if it covers all rows; the second is a safety net for txs without settings.)

Then apply:

```bash
npx prisma migrate dev
npx prisma generate
```

Expected: migrate succeeds; client regenerated.

- [ ] **Step 3: Extend `lib/types.ts` `Transaction`**

```typescript
export type Transaction = {
  id: string;
  createdAt: Date;
  updateAt: Date;
  amount: number;
  currency: string;
  amountInBase: number;
  fxRate: number;
  fxRateAt: Date;
  description: string;
  date: Date;
  userId: string;
  type: string;
  category: string;
  categoryIcon: string;
};
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations lib/types.ts
git commit -m "Add transaction multi-currency schema and backfill migration."
```

---

### Task 2: FX helper (TDD)

**Files:**
- Create: `lib/fx.ts`
- Create: `lib/__tests__/fx.test.ts`

**Interfaces:**
- Produces: `export async function getFxRate(from: string, to: string, at?: Date): Promise<number>`
- Produces: `export function computeAmountInBase(amount: number, fxRate: number): number`
- Consumes: currency codes as uppercase ISO strings

- [ ] **Step 1: Write failing tests**

Create `lib/__tests__/fx.test.ts`:

```typescript
import { afterEach, describe, expect, it, vi } from "vitest";
import { computeAmountInBase, getFxRate, __resetFxCacheForTests } from "@/lib/fx";

describe("computeAmountInBase", () => {
  it("multiplies amount by rate", () => {
    expect(computeAmountInBase(94000, 0.012)).toBeCloseTo(1128, 5);
  });
});

describe("getFxRate", () => {
  afterEach(() => {
    __resetFxCacheForTests();
    vi.unstubAllGlobals();
  });

  it("returns 1 for same currency without fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(getFxRate("USD", "USD")).resolves.toBe(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches and returns rate for cross currency", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ amount: 1, base: "INR", date: "2026-11-27", rates: { USD: 0.012 } }),
      })
    );
    await expect(getFxRate("INR", "USD")).resolves.toBe(0.012);
  });

  it("throws when provider fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    );
    await expect(getFxRate("INR", "USD")).rejects.toThrow(/exchange rate/i);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- lib/__tests__/fx.test.ts
```

Expected: FAIL (module `@/lib/fx` missing).

- [ ] **Step 3: Implement `lib/fx.ts`**

```typescript
type CacheKey = string;

const cache = new Map<CacheKey, { rate: number; expiresAt: number }>();
const TTL_MS = 60 * 60 * 1000; // 1 hour

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function __resetFxCacheForTests(): void {
  cache.clear();
}

export function computeAmountInBase(amount: number, fxRate: number): number {
  return amount * fxRate;
}

export async function getFxRate(
  from: string,
  to: string,
  at: Date = new Date()
): Promise<number> {
  const source = from.toUpperCase();
  const target = to.toUpperCase();
  if (source === target) return 1;

  const key = `${source}:${target}:${dayKey(at)}`;
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.rate;

  const baseUrl =
    process.env.FX_API_BASE_URL?.replace(/\/$/, "") ||
    "https://api.frankfurter.app";
  // Frankfurter: /latest or /YYYY-MM-DD
  const pathDate = dayKey(at);
  const today = dayKey(new Date());
  const path = pathDate === today ? "latest" : pathDate;
  const url = `${baseUrl}/${path}?from=${encodeURIComponent(source)}&to=${encodeURIComponent(target)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Could not fetch exchange rate");
  }
  const body = (await res.json()) as { rates?: Record<string, number> };
  const rate = body.rates?.[target];
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new Error("Could not fetch exchange rate");
  }

  cache.set(key, { rate, expiresAt: Date.now() + TTL_MS });
  return rate;
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- lib/__tests__/fx.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/fx.ts lib/__tests__/fx.test.ts
git commit -m "Add FX rate helper with cache and unit tests."
```

---

### Task 3: Zod schema + create/delete actions

**Files:**
- Modify: `schema/transaction.ts`
- Modify: `lib/__tests__/security-validation.test.ts`
- Modify: `app/(dashboard)/_actions/transactions.ts`
- Modify: `app/(dashboard)/transactions/_actions/deleteTransaction.ts`

**Interfaces:**
- Consumes: `getFxRate`, `computeAmountInBase` from `@/lib/fx`
- Consumes: `Currencies` allowlist via Zod enum of values
- Produces: `CreateTransaction` writes `currency`, `amountInBase`, `fxRate`, `fxRateAt`; history uses `amountInBase`
- Produces: `DeleteTransaction` decrements history by `transaction.amountInBase`

- [ ] **Step 1: Extend create schema**

In `schema/transaction.ts`:

```typescript
import { z } from "zod";
import { Currencies } from "@/lib/currencies";

const currencyValues = Currencies.map((c) => c.value) as [string, ...string[]];

export const CreateTransactionSchema = z.object({
  amount: z.coerce.number().positive().multipleOf(0.01),
  description: z.string().min(3).max(100),
  date: z.coerce.date(),
  category: z.string(),
  type: z.union([z.literal("income"), z.literal("expense")]),
  currency: z.enum(currencyValues),
});
```

- [ ] **Step 2: Add failing validation test**

Append to `lib/__tests__/security-validation.test.ts`:

```typescript
  it("rejects create-transaction currency outside allowlist", () => {
    const result = CreateTransactionSchema.safeParse({
      amount: 10,
      description: "coffee shop",
      date: new Date(),
      category: "Food",
      type: "expense",
      currency: "XYZ",
    });
    expect(result.success).toBe(false);
  });

  it("accepts allowlisted transaction currency", () => {
    const result = CreateTransactionSchema.safeParse({
      amount: 10,
      description: "coffee shop",
      date: new Date(),
      category: "Food",
      type: "expense",
      currency: "USD",
    });
    expect(result.success).toBe(true);
  });
```

Update existing create-transaction invalid test payload to include `currency: "INR"` so it still fails only on other fields — or leave currency out and expect failure for missing currency.

- [ ] **Step 3: Run schema tests**

```bash
npm test -- lib/__tests__/security-validation.test.ts
```

Expected: new tests PASS after schema change; fix any broken old tests by adding `currency`.

- [ ] **Step 4: Update `CreateTransaction`**

Replace history increments to use `amountInBase`, and create data to include snapshot fields:

```typescript
  const user = await requireActionUser();
  const { amount, category, date, description, type, currency } = parsedBody.data;

  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });
  if (!settings) {
    throw new Error("user settings not found");
  }

  // ... categoryRow lookup unchanged ...

  const fxRate = await getFxRate(currency, settings.currency, date);
  const amountInBase = computeAmountInBase(amount, fxRate);
  const fxRateAt = new Date();

  await prisma.$transaction([
    prisma.transaction.create({
      data: {
        userId: user.id,
        amount,
        currency,
        amountInBase,
        fxRate,
        fxRateAt,
        date,
        description: description || "",
        type,
        category: categoryRow.name,
        categoryIcon: categoryRow.icon,
      },
    }),
    // monthHistory / yearHistory: use amountInBase instead of amount in create/update increments
  ]);
```

Import `getFxRate` and `computeAmountInBase` from `@/lib/fx`.

- [ ] **Step 5: Update `DeleteTransaction`**

Change history decrements from `transaction.amount` to `transaction.amountInBase`.

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add schema/transaction.ts lib/__tests__/security-validation.test.ts \
  app/(dashboard)/_actions/transactions.ts \
  app/(dashboard)/transactions/_actions/deleteTransaction.ts
git commit -m "Snapshot FX on create and decrement history by amountInBase."
```

---

### Task 4: Create-transaction UI (currency field)

**Files:**
- Modify: `app/(dashboard)/_components/CreateTransactionDialog.tsx`
- Modify: any parent that needs default currency — dialog loads `userSettings` via existing query or prop

**Interfaces:**
- Consumes: `CreateTransactionSchema` with `currency`
- Consumes: `Currencies` from `@/lib/currencies`
- Consumes: `apiGet<UserSettings | null>("/api/user-settings")` or existing query key `["userSettings"]`

- [ ] **Step 1: Default currency from settings**

In `CreateTransactionDialog`, add React Query for settings (or accept `defaultCurrency` prop from dashboard if already available). Prefer:

```typescript
const settingsQuery = useQuery({
  queryKey: ["userSettings"],
  queryFn: () => apiGet<UserSettings | null>("/api/user-settings"),
});
```

Set form defaultValues `currency: settingsQuery.data?.currency ?? "INR"` and `form.setValue` when settings load.

- [ ] **Step 2: Add currency Select field**

Add a `FormField` name `"currency"` with shadcn `Select` listing `Currencies` (value + label). Include in `onSubmit` payload.

- [ ] **Step 3: Mutation error toast for FX failures**

Ensure `onError` shows the error message when present (e.g. exchange rate failure), not only generic text:

```typescript
onError: (err) => {
  toast.error(err instanceof Error ? err.message : "Something went wrong", {
    id: "create-transaction",
  });
},
```

(Server Actions may wrap errors — if message is opaque, keep generic toast; still must not succeed.)

- [ ] **Step 4: Manual smoke**

Run `npm run dev`, create expense in USD while base is INR (or reverse). Confirm row stores both currencies mentally via UI (Task 5) / Prisma Studio.

- [ ] **Step 5: Commit**

```bash
git add app/(dashboard)/_components/CreateTransactionDialog.tsx
git commit -m "Add currency picker to create transaction dialog."
```

---

### Task 5: Transactions table dual display

**Files:**
- Modify: `app/(dashboard)/transactions/_components/TransactionTable.tsx`
- Modify: `app/api/transactions-history/route.ts` if response needs base currency for formatting

**Interfaces:**
- Consumes: transaction `amount`, `currency`, `amountInBase`
- Consumes: user base currency from settings (already loaded in history route)

- [ ] **Step 1: Format original with tx currency**

In `getTransactionsHistory` (or table cell), format `amount` with `GetFormatterForCurrency(transaction.currency)` instead of only user settings currency.

- [ ] **Step 2: Show base equivalent when different**

When `transaction.currency !== userSettings.currency`, append secondary text using `GetFormatterForCurrency(userSettings.currency).format(transaction.amountInBase)` with an `≈` prefix.

- [ ] **Step 3: Commit**

```bash
git add app/api/transactions-history/route.ts \
  app/(dashboard)/transactions/_components/TransactionTable.tsx
git commit -m "Show original and base-equivalent amounts on transactions."
```

---

### Task 6: Base-currency change warning

**Files:**
- Modify: `components/common/CurrencyComboBox.tsx`
- Optionally: small Server Action or reuse settings null vs count — prefer client check via `useQuery` on transactions count **or** pass `hasTransactions` boolean from manage/wizard pages

**Interfaces:**
- Produces: confirm dialog or `window.confirm` before `mutation.mutate` when settings already exist AND user has ≥1 transaction

- [ ] **Step 1: Detect existing transactions**

Simplest v1: add optional prop:

```typescript
export function CurrencyComboBox({ warnOnChange = false }: { warnOnChange?: boolean })
```

On manage page set `warnOnChange`. Before mutate, if `warnOnChange && userSettings.data`:

```typescript
const ok = window.confirm(
  "Existing transactions keep their original currency and saved conversions. Only new transactions will use this as the base currency. Continue?"
);
if (!ok) return;
```

Wizard first-time upsert (null settings) skips warning.

- [ ] **Step 2: Wire manage page**

```tsx
<CurrencyComboBox warnOnChange />
```

- [ ] **Step 3: Commit**

```bash
git add components/common/CurrencyComboBox.tsx app/(dashboard)/manage/page.tsx
git commit -m "Warn before changing base currency when settings exist."
```

---

### Task 7: Docs + verification

**Files:**
- Modify: `docs/modernization/EXECUTION_PLAN.md` (add WP entry or note multi-currency WP)
- Modify: `docs/architecture/APPLICATION_ARCHITECTURE.md`
- Modify: `docs/architecture/SECURITY_GUIDELINES.md` (FX env name `FX_API_BASE_URL` optional)
- Create: `docs/modernization/WP_MULTI_CURRENCY_REPORT.md` (short completion report when done)

- [ ] **Step 1: Update architecture note**

Document: transactions store original + base snapshot; history in base; Frankfurter default endpoint.

- [ ] **Step 2: Full verify**

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

Expected: all pass (lint warnings only for pre-existing date-picker).

- [ ] **Step 3: Commit docs**

```bash
git add docs/
git commit -m "Document multi-currency behavior and FX configuration."
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| `currency`, `amountInBase`, `fxRate`, `fxRateAt` | Task 1 |
| Backfill existing rows | Task 1 |
| Server FX + cache + fail closed | Task 2 |
| Create uses snapshot; history `amountInBase` | Task 3 |
| Delete uses `amountInBase` | Task 3 |
| Zod allowlist | Task 3 |
| Create UI currency | Task 4 |
| Table dual display | Task 5 |
| Base change warning | Task 6 |
| Docs | Task 7 |
| No Decimal migration / no rebase | Explicit non-goals |

## Placeholder scan

No TBD/TODO steps remain; Frankfurter chosen as concrete provider; optional `FX_API_BASE_URL` documented.
