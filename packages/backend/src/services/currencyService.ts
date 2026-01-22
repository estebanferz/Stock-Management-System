export type Currency = "ARS" | "USD" | "EUR" | "BRL";

export type FxSnapshot = {
  ratesToARS: Record<Currency, number>; // ARS por 1 unidad
  updatedAt: string; // ISO
  isStale?: boolean;
};

let cache: FxSnapshot | null = null;
let cacheAt = 0;
const TTL_MS = 10 * 60 * 1000;

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`FX fetch failed: ${r.status}`);
  return r.json() as Promise<T>;
}

export async function getFxSnapshotVenta(): Promise<FxSnapshot> {
  const now = Date.now();
  if (cache && now - cacheAt < TTL_MS) return cache;

  try {
    const [usd, eur, brl] = await Promise.all([
      fetchJson<{ venta: number }>("https://dolarapi.com/v1/dolares/blue"),
      fetchJson<{ venta: number }>("https://dolarapi.com/v1/cotizaciones/eur"),
      fetchJson<{ venta: number }>("https://dolarapi.com/v1/cotizaciones/brl"),
    ]);

    cache = {
      ratesToARS: { ARS: 1, USD: usd.venta, EUR: eur.venta, BRL: brl.venta },
      updatedAt: new Date().toISOString(),
    };
    cacheAt = now;
    return cache;
  } catch (e) {
    if (cache) return { ...cache, isStale: true };
    throw e;
  }
}

export function convert(
  amount: number,
  from: Currency,
  to: Currency,
  ratesToARS: Record<Currency, number>
) {
  if (from === to) return amount;
  const ars = amount * ratesToARS[from];
  return ars / ratesToARS[to];
}