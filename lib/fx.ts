type CacheKey = string;

const cache = new Map<CacheKey, { rate: number; expiresAt: number }>();
const TTL_MS = 60 * 60 * 1000; // 1 hour

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function __resetFxCacheForTests(): void {
  cache.clear();
}

export function computeAmountInBase(amount: number, fxRate: number): number {
  return amount * fxRate;
}

export async function getFxRate(
  from: string,
  to: string,
  at: Date = new Date()
): Promise<number> {
  const source = from.toUpperCase();
  const target = to.toUpperCase();
  if (source === target) return 1;

  const key = `${source}:${target}:${dayKey(at)}`;
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.rate;

  const baseUrl =
    process.env.FX_API_BASE_URL?.replace(/\/$/, "") ||
    "https://api.frankfurter.app";
  // Frankfurter: /latest or /YYYY-MM-DD
  const pathDate = dayKey(at);
  const today = dayKey(new Date());
  const path = pathDate === today ? "latest" : pathDate;
  const url = `${baseUrl}/${path}?from=${encodeURIComponent(source)}&to=${encodeURIComponent(target)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Could not fetch exchange rate");
  }
  const body = (await res.json()) as { rates?: Record<string, number> };
  const rate = body.rates?.[target];
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new Error("Could not fetch exchange rate");
  }

  cache.set(key, { rate, expiresAt: Date.now() + TTL_MS });
  return rate;
}