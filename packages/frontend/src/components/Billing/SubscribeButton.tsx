import { useState } from "react";
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
  planKey?: string;
  onSubscribed?: () => void; // opcional: refetch de status
};

export function SubscribeButton({ planKey = "pro", onSubscribed }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenizing, setTokenizing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // tarjeta
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [docType, setDocType] = useState("DNI");
  const [docNumber, setDocNumber] = useState("");

  function getMp() {
    const key = window.__MP_PUBLIC_KEY__;
    if (!key) throw new Error("Falta PUBLIC_MP_PUBLIC_KEY");
    if (!window.MercadoPago) throw new Error("Mercado Pago SDK no cargó");
    return new window.MercadoPago(key);
  }

  async function onConfirm() {
    setErr(null);
    setTokenizing(true);

    try {
      const mp = getMp();

      const tokenResp = await mp.createCardToken({
        cardNumber: cardNumber.replace(/\s+/g, ""),
        cardholderName,
        cardExpirationMonth: expirationMonth,
        cardExpirationYear: expirationYear,
        securityCode,
        identificationType: docType,
        identificationNumber: docNumber,
      });

      const cardTokenId = tokenResp?.id;
      if (!cardTokenId) {
        const msg =
          tokenResp?.message ||
          tokenResp?.cause?.[0]?.description ||
          "No se pudo validar la tarjeta";
        throw new Error(msg);
      }

      setTokenizing(false);
      setLoading(true);

      const r = await clientApp.billing.subscription.post({
        planKey,
        cardTokenId,
      });

      if (!r.data?.ok) {
        throw new Error(r.data?.message ?? "No se pudo crear la suscripción");
      }

      setOpen(false);
      onSubscribed?.();
      // fallback simple:
      // window.location.reload();
    } catch (e: any) {
      setErr(e?.message ?? "Error");
      setTokenizing(false);
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={loading || tokenizing}>
        {loading ? "Creando suscripción..." : "Suscribirme"}
      </Button>

      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">Ingresá tu tarjeta</h2>
              <button
                className="text-zinc-500 hover:text-zinc-900"
                onClick={() => {
                  if (loading || tokenizing) return;
                  setOpen(false);
                }}
              >
                ✕
              </button>
            </div>

            <p className="mt-1 text-sm text-zinc-600">
              El pago se procesa de forma segura con Mercado Pago. No almacenamos tu tarjeta.
            </p>

            <div className="mt-4 space-y-3">
              <Input placeholder="Número de tarjeta" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
              <Input placeholder="Nombre del titular" value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} />

              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Mes (MM)" value={expirationMonth} onChange={(e) => setExpirationMonth(e.target.value)} />
                <Input placeholder="Año (YY o YYYY)" value={expirationYear} onChange={(e) => setExpirationYear(e.target.value)} />
              </div>

              <Input placeholder="CVV" value={securityCode} onChange={(e) => setSecurityCode(e.target.value)} />

              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Tipo doc (DNI)" value={docType} onChange={(e) => setDocType(e.target.value)} />
                <Input placeholder="Número doc" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
              </div>

              {err && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</div>}

              <Button className="w-full" onClick={onConfirm} disabled={loading || tokenizing}>
                {tokenizing ? "Validando tarjeta..." : loading ? "Creando suscripción..." : "Confirmar suscripción"}
              </Button>

              <p className="text-xs text-zinc-500">
                La suscripción quedará <span className="font-semibold">pendiente</span> hasta la confirmación de Mercado Pago.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SubscribeButton;
