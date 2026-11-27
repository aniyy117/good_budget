-- Money Float → Decimal + rename Transaction.updateAt → updatedAt (WP12)

-- Transaction money columns
ALTER TABLE "Transaction"
  ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2) USING ("amount"::decimal(18,2)),
  ALTER COLUMN "amountInBase" SET DATA TYPE DECIMAL(18,2) USING ("amountInBase"::decimal(18,2)),
  ALTER COLUMN "fxRate" SET DATA TYPE DECIMAL(18,8) USING ("fxRate"::decimal(18,8));

-- Rename updateAt → updatedAt
ALTER TABLE "Transaction" RENAME COLUMN "updateAt" TO "updatedAt";

-- History aggregates
ALTER TABLE "MonthHistory"
  ALTER COLUMN "income" SET DATA TYPE DECIMAL(18,2) USING ("income"::decimal(18,2)),
  ALTER COLUMN "expense" SET DATA TYPE DECIMAL(18,2) USING ("expense"::decimal(18,2));

ALTER TABLE "YearHistory"
  ALTER COLUMN "income" SET DATA TYPE DECIMAL(18,2) USING ("income"::decimal(18,2)),
  ALTER COLUMN "expense" SET DATA TYPE DECIMAL(18,2) USING ("expense"::decimal(18,2));
