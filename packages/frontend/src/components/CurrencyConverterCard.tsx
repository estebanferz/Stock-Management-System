import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRightLeft } from "lucide-react";

type Currency = "ARS" | "USD" | "EUR" | "BRL";

type FxSnapshot = {
  ratesToARS: Record<Currency, number>;
  updatedAt: string;
  isStale?: boolean;
};

const CURRENCIES: Currency[] = ["ARS", "USD", "EUR", "BRL"];

function parseNumberLoose(s: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/\s/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(n);
}

function convertAmount(
  amount: number,
  from: Currency,
  to: Currency,
  ratesToARS: Record<Currency, number>
) {
  if (from === to) return amount;
  const ars = amount * ratesToARS[from];
  return ars / ratesToARS[to];
}

function fmtUpdatedAt(iso?: string) {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short", hour12: false });
}

export function CurrencyConverterCard({
  apiPath = "/api/currency/fx/latest",
  refreshMs = 60_000,
  defaultFrom = "ARS",
  defaultTo = "USD",
}: {
  apiPath?: string;
  refreshMs?: number;
  defaultFrom?: Currency;
  defaultTo?: Currency;
}) {
  const [from, setFrom] = useState<Currency>(defaultFrom);
  const [to, setTo] = useState<Currency>(defaultTo);
  const [raw, setRaw] = useState<string>("");

  const [fx, setFx] = useState<FxSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  // evita from===to
  useEffect(() => {
    if (from === to) {
      const next = CURRENCIES.find((c) => c !== from) ?? "USD";
      setTo(next);
    }
  }, [from, to]);

  async function loadFx() {
    setErr(null);
    try {
      const res = await fetch(apiPath, { credentials: "include" });
      const data = (await res.json()) as FxSnapshot;

      if (!res.ok || !data?.ratesToARS) {
        throw new Error("No se pudo obtener cotización.");
      }

      setFx(data);
    } catch (e: any) {
      setErr(e?.message ?? "Error al obtener cotización.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFx();
    const t = setInterval(loadFx, refreshMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath, refreshMs]);

  const amount = useMemo(() => parseNumberLoose(raw), [raw]);

  const result = useMemo(() => {
    if (!fx?.ratesToARS) return null;
    if (amount == null) return null;
    return convertAmount(amount, from, to, fx.ratesToARS);
  }, [amount, from, to, fx]);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <Card className="rounded-2xl p-1 shadow-none">

      <CardContent className="space-y-2 px-2 py-2">
        <div className="flex items-center gap-2">
          <Input
            inputMode="decimal"
            placeholder="0"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="h-7"
          />

          <Select value={from} onValueChange={(v) => setFrom(v as Currency)}>
            <SelectTrigger className="h-7 w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 flex items-center justify-center"
            onClick={swap}
        >
            <ArrowRightLeft />
        </Button>

        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={result == null ? "" : formatNumber(result)}
            placeholder={loading ? "Cargando..." : "—"}
            className="h-7 bg-slate-50"
          />

          <Select value={to} onValueChange={(v) => setTo(v as Currency)}>
            <SelectTrigger className="h-7 w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center text-center justify-between text-xs text-slate-500">
          <div>
            {err ? (
              <span className="text-red-600">{err}</span>
            ) : (
              <>
                Actualizado: <span className="font-medium text-slate-700">{fmtUpdatedAt(fx?.updatedAt)}</span>
                {fx?.isStale ? <span className="ml-2 text-amber-600">(stale)</span> : null}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
