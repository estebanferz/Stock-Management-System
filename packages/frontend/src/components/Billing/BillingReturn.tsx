import { useEffect, useState } from "react";
import { clientApp } from "@/lib/clientAPI";

export default function BillingReturn() {
  const [status, setStatus] = useState("pending");
  const [msg, setMsg] = useState("Procesando tu suscripción…");

  useEffect(() => {
    let alive = true;
    let tries = 0;

    async function tick() {
      tries += 1;

      try {
        const { data, error } = await clientApp.billing.status.get();
        if (!alive) return;

        if (error || !data?.ok) {
          setMsg("No pudimos cargar el estado. Reintentando…");
        } else {
          const s = (data as any).subscription_status ?? "inactive";
          setStatus(s);

          if (s === "active") {
            setMsg("¡Listo! Suscripción activa. Entrando…");
            setTimeout(() => (window.location.href = "/dashboard"), 800);
            return;
          }

          if (s === "trial") {
            setMsg("Estás en prueba gratis. Entrando…");
            setTimeout(() => (window.location.href = "/dashboard"), 800);
            return;
          }

          if (s === "pending") setMsg("Confirmando con Mercado Pago…");
          else setMsg("No pudimos activar la suscripción. Volvé a intentar.");
        }
      } catch {
        if (!alive) return;
        setMsg("Error de red. Reintentando…");
      }

      if (tries < 15) setTimeout(tick, 2000);
      else setMsg("Sigue en proceso. Probá recargar en unos segundos.");
    }

    tick();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black tracking-tight">Suscripción</h1>
        <p className="mt-2 text-sm text-zinc-700">{msg}</p>
        <div className="mt-4 text-xs text-zinc-500">
          Estado: <span className="font-semibold text-zinc-900">{status}</span>
        </div>
        <div className="mt-6 flex gap-3">
          <a className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50" href="/dashboard/settings/billing">
            Ver facturación
          </a>
          <a className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800" href="/dashboard">
            Ir al dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
