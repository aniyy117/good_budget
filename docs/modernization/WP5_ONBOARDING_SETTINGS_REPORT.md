# WP5 — Onboarding Settings Create Path Report

**Date:** 27 November 2026  
**Work package:** WP5  
**Stack:** Next.js 14.2.35 · Clerk 5.0.3 · Prisma 5.13  

Related: [`EXECUTION_PLAN.md`](./EXECUTION_PLAN.md) · [`WP3_CLIENT_FETCH_MUTATION_HYGIENE_REPORT.md`](./WP3_CLIENT_FETCH_MUTATION_HYGIENE_REPORT.md)

---

## 1. Verdict

| Criterion | Result |
|-----------|--------|
| `GET /api/user-settings` is read-only | **Yes** — returns settings or `null` |
| No auto-create of INR on GET | **Yes** |
| Currency select upserts settings | **Yes** — `UpdateUserCurrency` |
| Dashboard still redirects to `/wizard` when settings missing | **Yes** (unchanged gate) |
| Visiting wizard alone does not complete onboarding | **Yes** — must choose currency |
| WP5 ready for approval | **Yes** |

**Do not start WP6** until explicitly approved.

---

## 2. Issues addressed

| Issue | Before | After |
|-------|--------|-------|
| BUG-01 | GET created `UserSettings` with `INR` | GET is read-only; `null` if missing |
| BUG-11 | `update` failed if row missing | `upsert` create/update |
| BUG-12 (small) | Awkward `Let 's` copy | `Let's` |
| Side-effect GET `revalidatePath` | On GET | Moved to mutation (`UpdateUserCurrency`) |

---

## 3. Behavior

```text
Signed-in user → /
  └─ no UserSettings → redirect /wizard
       └─ CurrencyComboBox GET /api/user-settings → null (no create)
       └─ user picks currency → UpdateUserCurrency upsert → settings exist
       └─ link to / → dashboard loads
```

Manage page currency changes also use the same upsert path.

---

## 4. Files touched

| Path | Change |
|------|--------|
| `app/api/user-settings/route.ts` | Read-only GET |
| `app/wizard/_actions/userSettings.ts` | Upsert + revalidatePath |
| `components/common/CurrencyComboBox.tsx` | Allow `null` settings |
| `app/wizard/page.tsx` | Copy fix |
| Docs listed below | Status |

---

## 5. Verification

| Check | Result |
|-------|--------|
| `npm run lint` | Pass (2 pre-existing date-picker warnings) |
| `npx tsc --noEmit` | Pass |
| `npm run build` | Pass |
| `npm test` | 6 passed |

Manual expectation: open `/wizard` without selecting currency → `/` still redirects to wizard; after selecting a currency, dashboard is reachable.

---

## 6. Residual

1. “I'm done! Take me to the dashboard” remains clickable before currency select (harmless redirect loop via dashboard gate). Optional UX: disable until settings exist.  
2. QUAL-12 — action still under `app/wizard/_actions/` while reused from Manage.  
3. Next: **WP6** RSC shells for manage/transactions.

---

## 7. Completion checklist

- [x] Read-only user-settings GET  
- [x] Upsert on currency select  
- [x] Dashboard gate still meaningful  
- [x] lint / tsc / build / tests  
- [x] Docs updated  
