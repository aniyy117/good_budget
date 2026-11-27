import { describe, expect, it } from "vitest";
import { OverviewQuerySchema } from "@/schema/overview";
import { DeleteCategorySchema } from "@/schema/categories";
import { MAX_DATE_RANGE_DAYS } from "@/lib/constants";

describe("OverviewQuerySchema", () => {
  it("accepts a valid date range within the max window", () => {
    const from = new Date("2024-01-01T00:00:00.000Z");
    const to = new Date("2024-01-31T00:00:00.000Z");
    expect(OverviewQuerySchema.safeParse({ from, to }).success).toBe(true);
  });

  it("rejects inverted ranges", () => {
    const from = new Date("2024-02-01T00:00:00.000Z");
    const to = new Date("2024-01-01T00:00:00.000Z");
    expect(OverviewQuerySchema.safeParse({ from, to }).success).toBe(false);
  });

  it("rejects ranges longer than MAX_DATE_RANGE_DAYS", () => {
    const from = new Date("2024-01-01T00:00:00.000Z");
    const to = new Date(from);
    to.setUTCDate(to.getUTCDate() + MAX_DATE_RANGE_DAYS + 1);
    expect(OverviewQuerySchema.safeParse({ from, to }).success).toBe(false);
  });
});

describe("DeleteCategorySchema", () => {
  it("requires name and type", () => {
    expect(
      DeleteCategorySchema.safeParse({ name: "Food", type: "expense" }).success
    ).toBe(true);
    expect(DeleteCategorySchema.safeParse({ name: "ab", type: "expense" }).success).toBe(
      false
    );
    expect(
      DeleteCategorySchema.safeParse({ name: "Food", type: "transfer" }).success
    ).toBe(false);
  });
});
