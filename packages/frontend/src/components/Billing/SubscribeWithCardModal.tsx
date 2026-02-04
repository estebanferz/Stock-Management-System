// components/Billing/SubscribeWithCardModal.tsx
import { useMemo, useState } from "react";
import { clientApp } from "@/lib/clientAPI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    MercadoPago?: any;
    __MP_PUBLIC_KEY__?: string;
  }
}

type Props = {
  planKey?: string; // "pro"
};

export function SubscribeWithCardModal({ planKey = "pro" }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // form fields (simple; después lo pulimos)
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [docType, setDocType] = useState("DNI");
  const [docNumber, setDocNumber] = useState("");

  const mp = useMemo(() => {
    const key = window.__MP_PUBLIC_KEY__;
    if (!key || !window.MercadoPago) return null;
    return new window.MercadoPago(key);
  }, [open]);

  async function onConfirm() {
    setErr(null);

    if (!mp) {
      setErr("Mercado Pago SDK no está listo (public key / script).");
      return;
    }

    setBusy(true);
    try {
      // ✅ Tokenización: NO enviás la tarjeta a tu backend.
      const tokenResp = await mp.createCardToken({
        cardNumber: cardNumber.replace(/\s+/g, ""),
        cardholderName,
        cardExpirationMonth: expirationMonth,
        cardExpirationYear: expirationYear,
        securityCode,
        identificationType: docType,
        identificationNumber: docNumber,
      });

      if (!tokenResp?.id) {
        const msg =
          tokenResp?.message ||
          tokenResp?.cause?.[0]?.description ||
          "No se pudo tokenizar la tarjeta";
        throw new Error(msg);
      }

      const cardTokenId = tokenResp.id as string;

      // ✅ llamás a tu backend
      const res = await clientApp.billing.subscription.post({
        planKey,
        cardTokenId,
      });

      if (!res.data?.ok) {
        throw new Error(res.data?.message ?? "No se pudo crear la suscripción");
      }

      setOpen(false);
      // opcional: refrescar status en la UI (poll / refetch)
      window.location.reload();
    } catch (e: any) {
      setErr(e?.message ?? "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Suscribirme</Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">Ingresá tu tarjeta</h2>
              <button
                className="text-zinc-500 hover:text-zinc-900"
                onClick={() => (busy ? null : setOpen(false))}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <p className="mt-1 text-sm text-zinc-600">
              Tus datos se tokenizan con Mercado Pago. Nosotros no almacenamos tu tarjeta.
            </p>

            <div className="mt-4 space-y-3">
              <Input placeholder="Número de tarjeta" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
              <Input placeholder="Nombre del titular" value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} />

              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Mes (MM)" value={expirationMonth} onChange={(e) => setExpirationMonth(e.target.value)} />
                <Input placeholder="Año (YY o YYYY)" value={expirationYear} onChange={(e) => setExpirationYear(e.target.value)} />
              </div>

              <Input placeholder="Código de seguridad" value={securityCode} onChange={(e) => setSecurityCode(e.target.value)} />

              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Doc tipo (DNI)" value={docType} onChange={(e) => setDocType(e.target.value)} />
                <Input placeholder="Doc número" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
              </div>

              {err && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</div>}

              <Button className="w-full" onClick={onConfirm} disabled={busy}>
                {busy ? "Procesando..." : "Confirmar suscripción"}
              </Button>

              <div className="text-xs text-zinc-500">
                Al confirmar, autorizás el cobro mensual según el plan elegido.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
