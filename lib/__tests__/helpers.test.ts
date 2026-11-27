import { describe, expect, it } from "vitest";
import { DateToUTCDate, GetFormatterForCurrency } from "@/lib/helpers";

describe("DateToUTCDate", () => {
  it("returns a Date with matching UTC calendar fields", () => {
    const local = new Date(2024, 0, 15, 12, 30, 0);
    const utc = DateToUTCDate(local);
    expect(utc.getUTCFullYear()).toBe(2024);
    expect(utc.getUTCMonth()).toBe(0);
    expect(utc.getUTCDate()).toBe(15);
  });
});

describe("GetFormatterForCurrency", () => {
  it("formats INR amounts", () => {
    const formatter = GetFormatterForCurrency("INR");
    const formatted = formatter.format(1000);
    expect(formatted).toMatch(/1/);
    expect(formatted.length).toBeGreaterThan(0);
  });

  it("formats USD amounts", () => {
    const formatter = GetFormatterForCurrency("USD");
    expect(formatter.format(12.5)).toMatch(/12/);
  });
});
