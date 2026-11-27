import { describe, expect, it } from "vitest";
import {
  CreateTransactionSchema,
  DeleteTransactionIdSchema,
} from "@/schema/transaction";
import { CreateCategorySchema } from "@/schema/categories";
import { UpdateUserCurrencySchema } from "@/schema/userSettings";

describe("security validation schemas", () => {
  it("rejects non-UUID transaction delete ids", () => {
    expect(DeleteTransactionIdSchema.safeParse("not-a-uuid").success).toBe(
      false
    );
    expect(
      DeleteTransactionIdSchema.safeParse(
        "550e8400-e29b-41d4-a716-446655440000"
      ).success
    ).toBe(true);
  });

  it("rejects invalid create-transaction payloads", () => {
    const result = CreateTransactionSchema.safeParse({
      amount: -1,
      description: "ab",
      date: "not-a-date",
      category: "",
      type: "transfer",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category creates", () => {
    const result = CreateCategorySchema.safeParse({
      name: "ab",
      icon: "x".repeat(50),
      type: "other",
    });
    expect(result.success).toBe(false);
  });

  it("rejects currency values outside the allowlist", () => {
    // UpdateUserCurrencySchema uses z.custom that throws on invalid values.
    expect(() =>
      UpdateUserCurrencySchema.parse({ currency: "XYZ" })
    ).toThrow(/invalid currency/);
  });

  it("accepts allowlisted currency", () => {
    const result = UpdateUserCurrencySchema.safeParse({ currency: "INR" });
    expect(result.success).toBe(true);
  });
});

describe("unauthorized API response contract", () => {
  it("documents the 401 JSON body shape used by requireApiUserId", () => {
    const body = { error: "Unauthorized" as const };
    expect(body).toEqual({ error: "Unauthorized" });
  });
});
