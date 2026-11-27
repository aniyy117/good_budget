import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { toDecimal, toNumber } from "@/lib/money";

describe("toNumber", () => {
  it("passes through finite numbers", () => {
    expect(toNumber(12.34)).toBe(12.34);
  });

  it("converts Prisma.Decimal", () => {
    expect(toNumber(new Prisma.Decimal("99.50"))).toBe(99.5);
  });

  it("uses fallback for null/undefined/NaN", () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined, 1)).toBe(1);
    expect(toNumber(Number.NaN, 2)).toBe(2);
  });
});

describe("toDecimal", () => {
  it("creates a Decimal from number", () => {
    expect(toDecimal(10.5).toString()).toBe("10.5");
  });
});
