import { Prisma } from "@prisma/client";

export type DecimalLike =
  | Prisma.Decimal
  | number
  | string
  | null
  | undefined;

/**
 * Convert Prisma Decimal / numeric input to a finite JS number for formatters & JSON.
 * Prefer this at API/UI boundaries; keep Decimal in DB writes.
 */
export function toNumber(value: DecimalLike, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  const n = Number(value.toString());
  return Number.isFinite(n) ? n : fallback;
}

/** Prisma write helper — stores fixed-scale decimal amounts. */
export function toDecimal(value: number | string): Prisma.Decimal {
  return new Prisma.Decimal(value);
}
