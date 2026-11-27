-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "amountInBase" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "fxRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "fxRateAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

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
