# WP8 — Performance Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox (`- [ ]`) syntax. **Do not git commit unless the user explicitly asks.**

**Goal:** Lower `/` First Load JS via dynamic recharts/emoji-mart; RQ `staleTime`; Devtools development-only (PERF-01, PERF-02).

**Architecture:** Keep History/CreateCategoryDialog UX; move heavy libs behind `next/dynamic` or lazy `import()`. Configure QueryClient defaults in `RootProviders`.

**Tech Stack:** Next.js 14.2.35, React 18, TanStack Query 5, recharts, emoji-mart.

## Global Constraints

- Next **14.2.35** — no major upgrade.
- No WP9/WP10 scope.
- Preserve chart rendering and emoji select behavior.
- No commits unless user says so.
- Verify: `nvm use 20; npm run lint; npx tsc --noEmit; npm test; npm run build`

---

### Task 1: React Query defaults + Devtools gate

**Files:**
- Modify: `components/providers/RootProviders.tsx`

- [ ] **Step 1:** Set QueryClient defaults

```tsx
const [queryClient] = React.useState(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,
        },
      },
    })
);
```

- [ ] **Step 2:** Render Devtools only in development

```tsx
{process.env.NODE_ENV === "development" && (
  <ReactQueryDevtools initialIsOpen={false} />
)}
```

- [ ] **Step 3:** `npx tsc --noEmit` passes

---

### Task 2: Dynamic-import History chart (recharts)

**Files:**
- Create: `app/(dashboard)/_components/HistoryChart.tsx` (client; contains BarChart tree currently inline in History)
- Modify: `app/(dashboard)/_components/History.tsx`

- [ ] **Step 1:** Move recharts JSX + imports into `HistoryChart` accepting props: `data`, `timeframe`, `formatter`

- [ ] **Step 2:** In `History.tsx`:

```tsx
import dynamic from "next/dynamic";

const HistoryChart = dynamic(
  () => import("@/app/(dashboard)/_components/HistoryChart"),
  {
    ssr: false,
    loading: () => <div className="h-[300px] w-full animate-pulse rounded-md bg-muted" />,
  }
);
```

Render `<HistoryChart ... />` when `dataAvailable`.

- [ ] **Step 3:** `npx tsc --noEmit` passes; build shows `/` First Load not increased

---

### Task 3: Lazy-load emoji-mart in CreateCategoryDialog

**Files:**
- Modify: `app/(dashboard)/_components/CreateCategoryDialog.tsx`

- [ ] **Step 1:** Remove static `import Picker from "@emoji-mart/react"` and `import data from "@emoji-mart/data"`

- [ ] **Step 2:** When `isOpenEmojiPicker` is true, dynamically import and render picker (state for `Picker` component + `data`, or `next/dynamic` with `ssr: false` only mounting inside open PopoverContent)

Example pattern:

```tsx
const EmojiPicker = dynamic(() => import("@emoji-mart/react"), { ssr: false });
// data: dynamic import once when popover opens
```

Prefer: load data+picker on first open via `useEffect` when `isOpenEmojiPicker` becomes true, show small Loader2 until ready.

- [ ] **Step 3:** Selecting emoji still sets form icon and closes popover

- [ ] **Step 4:** `npx tsc --noEmit` passes

---

### Task 4: Docs + verification (no commit)

**Files:**
- Modify: `docs/modernization/EXECUTION_PLAN.md`, `MODERNIZATION_ROADMAP.md`
- Create: `docs/modernization/WP8_PERFORMANCE_REPORT.md`

- [ ] **Step 1:** Full verify (lint, tsc, test, build); record `/` First Load JS from build output vs ~426 kB baseline

- [ ] **Step 2:** Update docs status to Completed

- [ ] **Step 3:** Stop — wait for user to request commit

---

## Spec coverage

| Requirement | Task |
|-------------|------|
| Dynamic recharts | Task 2 |
| Dynamic emoji-mart | Task 3 |
| RQ staleTime | Task 1 |
| Devtools dev-only | Task 1 |
| Docs + verify | Task 4 |
