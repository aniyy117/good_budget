import { afterEach, describe, expect, it, vi } from "vitest";
import { computeAmountInBase, getFxRate, __resetFxCacheForTests } from "@/lib/fx";

describe("computeAmountInBase", () => {
  it("multiplies amount by rate", () => {
    expect(computeAmountInBase(94000, 0.012)).toBeCloseTo(1128, 5);
  });
});

describe("getFxRate", () => {
  afterEach(() => {
    __resetFxCacheForTests();
    vi.unstubAllGlobals();
  });

  it("returns 1 for same currency without fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(getFxRate("USD", "USD")).resolves.toBe(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches and returns rate for cross currency", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ amount: 1, base: "INR", date: "2026-11-27", rates: { USD: 0.012 } }),
      })
    );
    await expect(getFxRate("INR", "USD")).resolves.toBe(0.012);
  });

  it("throws when provider fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    );
    await expect(getFxRate("INR", "USD")).rejects.toThrow(/exchange rate/i);
  });
});