/**
 * App domain types mirroring Prisma models.
 * Prefer these over `@prisma/client` model imports in UI/API code so
 * client bundles and the IDE do not depend on generated Prisma exports.
 */

export type TransactionType = "income" | "expense";
export type Timeframe = "month" | "year";
export type Period = { year: number; month: number };

// --- Entity shapes (canonical) ---

export type UserSettings = {
  userId: string;
  currency: string;
};

export type Category = {
  createdAt: Date;
  name: string;
  userId: string;
  icon: string;
  type: string;
};

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

// --- Narrow views (Pick / extend) ---

/** Currency formatter consumers (dashboard cards, history). */
export type UserCurrencySettings = Pick<UserSettings, "currency">;

/** Category picker / list rows that only need display fields. */
export type CategoryOption = Pick<Category, "name" | "icon">;

/** Delete / manage flows that need identity fields. */
export type CategoryIdentity = Pick<Category, "name" | "type">;

export type CategorySummary = CategoryOption & CategoryIdentity;

// --- Aggregate / groupBy rows ---

export type AmountSum = {
  amount: number | null;
};

export type IncomeExpenseSum = {
  income: number | null;
  expense: number | null;
};

export type BalanceGroupRow = {
  type: string;
  _sum: AmountSum;
};

export type CategoryStatsRow = Pick<
  Transaction,
  "type" | "category" | "categoryIcon"
> & {
  _sum: AmountSum;
};

export type YearHistoryGroupRow = {
  month: number;
  _sum: IncomeExpenseSum;
};

export type MonthHistoryGroupRow = {
  day: number;
  _sum: IncomeExpenseSum;
};

export type YearRow = Pick<Period, "year">;

export type HistoryPoint = {
  expense: number;
  income: number;
  year: number;
  month: number;
  day?: number;
};
