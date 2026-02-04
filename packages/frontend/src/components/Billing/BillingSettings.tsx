import { useEffect, useMemo, useState } from "react";
import { clientApp } from "@/lib/clientAPI";
import { SubscribeButton } from "./SubscribeButton";

type BillingStatus = {
  ok: true;
  subscription_status?: string;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  plan?: { key: string; name: string; price_amount: string; currency: string } | null;
};

function fmtDateAR(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" });
}

export default function BillingSettings() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BillingStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await clientApp.billing.status.get();

      if (error || !data?.ok) {
        setErr("No se pudo cargar el estado de facturación.");
        setData(null);
        setLoading(false);
        return;
      }

      setData(data as any);
      setLoading(false);
    } catch {
      setErr("Error de red al cargar facturación.");
      setData(null);
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const status = data?.subscription_status ?? "inactive";

  const badge = useMemo(() => {
    const base = "rounded-full border px-3 py-1 text-xs font-semibold";
    if (status === "active") return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
    if (status === "trial") return `${base} border-zinc-200 bg-zinc-50 text-zinc-700`;
    if (status === "pending") return `${base} border-amber-200 bg-amber-50 text-amber-700`;
    if (status === "past_due") return `${base} border-red-200 bg-red-50 text-red-700`;
    if (status === "canceled") return `${base} border-zinc-200 bg-zinc-50 text-zinc-700`;
    return `${base} border-zinc-200 bg-zinc-50 text-zinc-700`;
  }, [status]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Facturación</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Gestioná tu suscripción y el acceso a tu cuenta.
          </p>
        </div>

        <div className={badge}>
          {status === "active" && "Activa"}
          {status === "trial" && "Prueba gratis"}
          {status === "pending" && "Pendiente"}
          {status === "past_due" && "Pago pendiente"}
          {status === "canceled" && "Cancelada"}
          {status === "inactive" && "Inactiva"}
          {!["active","trial","pending","past_due","canceled","inactive"].includes(status) && status}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-bold">Estado</div>

          {loading ? (
            <div className="mt-3 text-sm text-zinc-600">Cargando…</div>
          ) : err ? (
            <div className="mt-3 text-sm text-red-600">{err}</div>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-zinc-700">
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Suscripción</span>
                <span className="font-semibold">{status}</span>
              </div>

              {data?.trial_ends_at ? (
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Finaliza prueba</span>
                  <span className="font-semibold">{fmtDateAR(data.trial_ends_at)}</span>
                </div>
              ) : null}

              {data?.current_period_end ? (
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Próxima renovación</span>
                  <span className="font-semibold">{fmtDateAR(data.current_period_end)}</span>
                </div>
              ) : null}
            </div>
          )}

          <button
            type="button"
            onClick={load}
            className="mt-5 inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Actualizar
          </button>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-bold">Plan</div>

          <div className="mt-3 text-sm text-zinc-700">
            {(data as any)?.plan?.name ? (
              <>
                <div className="font-semibold">{(data as any).plan.name}</div>
                <div className="mt-1 text-zinc-600">
                  ${(data as any).plan.price_amount} {(data as any).plan.currency} / mes
                </div>
              </>
            ) : (
              <div className="text-zinc-600">Plan Pro (por defecto)</div>
            )}
          </div>

          <div className="mt-5">
            {status === "active" ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Tu suscripción está activa ✅
              </div>
            ) : (
              <SubscribeButton planKey="pro" />
            )}
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            Al activar, vas a ser redirigido a Mercado Pago para autorizar la suscripción.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
        <div className="text-sm font-bold">¿Necesitás ayuda?</div>
        <p className="mt-1 text-sm text-zinc-700">
          Si tu pago quedó “pendiente” o necesitás factura, escribinos.
        </p>
        <a
          className="mt-3 inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          href="mailto:support@zuma.app"
        >
          Contactar soporte
        </a>
      </div>
    </div>
  );
}
