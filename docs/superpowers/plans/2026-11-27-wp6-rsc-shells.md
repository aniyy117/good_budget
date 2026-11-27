# WP6 — RSC Shells for Manage & Transactions

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `/manage` and `/transactions` from full-page `"use client"` to RSC page shells with client islands (ARCH-01).

**Architecture:** Match the home dashboard pattern: Server Component `page.tsx` owns static chrome (titles/copy); interactive pieces live in `"use client"` children. Auth remains via `(dashboard)/layout.tsx` `requirePageAuth()` — do not duplicate Clerk gates unless needed. Preserve existing markup and behavior.

**Tech Stack:** Next.js 14.2.35 App Router, React 18, existing TanStack Query / shadcn components.

## Global Constraints

- Current stack Next.js **14.2.35** / React **18** — do not upgrade Next.
- No unrelated refactors (no WP7 date-range DRY, no emoji popover fixes).
- Preserve CurrencyComboBox `warnOnChange` on manage.
- Preserve date-range max (`MAX_DATE_RANGE_DAYS`) toast behavior on transactions.
- Prefer `import type` for types; keep `strict` TypeScript.
- Verify with `nvm use 20; npm run lint; npx tsc --noEmit; npm run build`.

---

### Task 1: Manage page RSC shell

**Files:**
- Create: `app/(dashboard)/manage/_components/ManagePageContent.tsx`
- Modify: `app/(dashboard)/manage/page.tsx` (remove `"use client"`; keep static header only)

**Interfaces:**
- Consumes: existing `CreateCategoryDialog`, `DeleteCategoryDialog`, `CurrencyComboBox`, `apiGet`, `Category`, `TransactionType`
- Produces: `ManagePageContent` default or named export — client component with currency card + income/expense category lists

- [ ] **Step 1: Move interactive manage UI into client component**

Create `app/(dashboard)/manage/_components/ManagePageContent.tsx`:

```tsx
"use client";

import CreateCategoryDialog from "@/app/(dashboard)/_components/CreateCategoryDialog";
import DeleteCategoryDialog from "@/app/(dashboard)/_components/DeleteCategoryDialog";
import { CurrencyComboBox } from "@/components/common/CurrencyComboBox";
import SkeletonWrapper from "@/components/common/SkeletonWrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMediaQuery } from "@/hooks/use-media-query";
import { apiGet } from "@/lib/api";
import type { Category, TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { PlusSquare, TrashIcon, TrendingDown, TrendingUp } from "lucide-react";
import React from "react";

export default function ManagePageContent() {
  return (
    <div className="container flex flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <CardDescription>
            Set your default currency for transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CurrencyComboBox warnOnChange />
        </CardContent>
      </Card>
      <CategoryList type="income" />
      <CategoryList type="expense" />
    </div>
  );
}

function CategoryList({ type }: { type: TransactionType }) {
  // ... move existing CategoryList + CategoryCard unchanged from manage/page.tsx
}
```

Copy `CategoryList` and `CategoryCard` bodies exactly from the current `manage/page.tsx` (do not change query keys, UI, or delete behavior).

- [ ] **Step 2: Convert manage `page.tsx` to RSC shell**

Replace `app/(dashboard)/manage/page.tsx` with:

```tsx
import ManagePageContent from "@/app/(dashboard)/manage/_components/ManagePageContent";
import React from "react";

function ManagePage() {
  return (
    <>
      <div className="border-b bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-6 py-8">
          <div>
            <p className="text-3xl font-bold">Manage</p>
            <p className="text-muted-foreground">
              Manage your account settings and categories
            </p>
          </div>
        </div>
      </div>
      <ManagePageContent />
    </>
  );
}

export default ManagePage;
```

No `"use client"` on this file.

- [ ] **Step 3: Typecheck**

Run: `source ~/.nvm/nvm.sh && nvm use 20 && npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/manage/page.tsx app/(dashboard)/manage/_components/ManagePageContent.tsx
git commit -m "Extract manage page client island behind RSC shell."
```

---

### Task 2: Transactions page RSC shell

**Files:**
- Create: `app/(dashboard)/transactions/_components/TransactionsPageContent.tsx`
- Modify: `app/(dashboard)/transactions/page.tsx`

**Interfaces:**
- Consumes: `TransactionTable`, `DateRangePicker`, `MAX_DATE_RANGE_DAYS`, `differenceInDays`, `startOfMonth`, `toast`
- Produces: `TransactionsPageContent({ children })` — `children` is the RSC-rendered title slot placed beside the date picker

- [ ] **Step 1: Create client content with RSC title slot**

Create `app/(dashboard)/transactions/_components/TransactionsPageContent.tsx`:

```tsx
"use client";

import TransactionTable from "@/app/(dashboard)/transactions/_components/TransactionTable";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MAX_DATE_RANGE_DAYS } from "@/lib/constants";
import { differenceInDays, startOfMonth } from "date-fns";
import React, { useState } from "react";
import { toast } from "sonner";

export default function TransactionsPageContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  return (
    <>
      <div className="border-b bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-6 py-8">
          {children}
          <DateRangePicker
            initialDateFrom={dateRange.from}
            initialDateTo={dateRange.to}
            showCompare={false}
            onUpdate={(values) => {
              const { from, to } = values.range;
              if (!from || !to) return;
              if (differenceInDays(to, from) > MAX_DATE_RANGE_DAYS) {
                toast.error(
                  `The selected date range is too big. Max allowed range is ${MAX_DATE_RANGE_DAYS} days!`
                );
                return;
              }
              setDateRange({ from, to });
            }}
          />
        </div>
      </div>
      <div className="container">
        <TransactionTable from={dateRange.from} to={dateRange.to} />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Convert transactions `page.tsx` to RSC shell**

Replace `app/(dashboard)/transactions/page.tsx` with:

```tsx
import TransactionsPageContent from "@/app/(dashboard)/transactions/_components/TransactionsPageContent";
import React from "react";

function TransactionsPage() {
  return (
    <TransactionsPageContent>
      <div>
        <p className="text-3xl font-bold">Transactions history</p>
      </div>
    </TransactionsPageContent>
  );
}

export default TransactionsPage;
```

No `"use client"` on this file.

- [ ] **Step 3: Typecheck**

Run: `source ~/.nvm/nvm.sh && nvm use 20 && npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add app/(dashboard)/transactions/page.tsx app/(dashboard)/transactions/_components/TransactionsPageContent.tsx
git commit -m "Extract transactions page client island behind RSC shell."
```

---

### Task 3: Docs + verification

**Files:**
- Modify: `docs/modernization/EXECUTION_PLAN.md` (WP6 status → Completed)
- Modify: `docs/modernization/MODERNIZATION_ROADMAP.md` (ARCH-01 row)
- Modify: `docs/architecture/APPLICATION_ARCHITECTURE.md` (route map: manage/transactions RSC + client)
- Create: `docs/modernization/WP6_RSC_SHELLS_REPORT.md`

- [ ] **Step 1: Write short WP6 report**

Include: verdict table (static headers RSC; interactivity isolated; layout auth unchanged), files touched, verification results, residual (WP7 next).

- [ ] **Step 2: Update EXECUTION_PLAN WP6 status to Completed with report link**

- [ ] **Step 3: Update roadmap ARCH-01 / manage-transactions RSC status to Completed**

- [ ] **Step 4: Update APPLICATION_ARCHITECTURE route map**

Change manage/transactions rendering notes from “Full CSR” to “RSC shell + client islands”.

- [ ] **Step 5: Full verify**

```bash
source ~/.nvm/nvm.sh && nvm use 20
npm run lint
npx tsc --noEmit
npm test
npm run build
```

Expected: lint warnings only for pre-existing `date-range-picker`; tests pass; build pass. Confirm `/manage` and `/transactions` still listed as dynamic routes.

- [ ] **Step 6: Commit**

```bash
git add docs/
git commit -m "Document WP6 RSC shells for manage and transactions."
```

---

## Spec coverage checklist

| Requirement | Task |
|-------------|------|
| Manage static header RSC | Task 1 |
| Manage interactivity isolated | Task 1 |
| Transactions static title RSC (children slot) | Task 2 |
| Transactions date range + table client | Task 2 |
| Docs / ARCH-01 closed | Task 3 |
| No WP7/WP8 scope creep | Global constraints |

## Placeholder scan

None — concrete files and code included.
