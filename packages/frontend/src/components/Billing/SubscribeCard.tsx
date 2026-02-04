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
  planKey: string;
  planName: string;
  priceLabel: string;
  isCurrent?: boolean;

  subscriptionStatus: "trial" | "inactive" | "pending" | "active" | "past_due" | "canceled";
  trialDaysLeft: number | null;

  onSubscribed?: () => void;
};

export function SubscribeCard({
  planKey,
  planName,
  priceLabel,
  isCurrent,
  subscriptionStatus,
  trialDaysLeft,
  onSubscribed,
}: Props) {
  const [loadingCard, setLoadingCard] = useState(false);
  const [tokenizing, setTokenizing] = useState(false);

  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // fields tarjeta
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [docType, setDocType] = useState("DNI");
  const [docNumber, setDocNumber] = useState("");

  const canSubscribe = useMemo(() => {
    if (subscriptionStatus === "active") return false;
    if (subscriptionStatus === "pending") return false;
    return true;
  }, [subscriptionStatus]);

  const busy = loadingCard || tokenizing ;

  function getMpInstance() {
    const key = window.__MP_PUBLIC_KEY__;
    if (!key) throw new Error("Falta PUBLIC_MP_PUBLIC_KEY (window.__MP_PUBLIC_KEY__).");
    if (!window.MercadoPago) throw new Error("Mercado Pago SDK no cargó (MercadoPago undefined).");
    return new window.MercadoPago(key);
  }

  function openModal() {
    setErr(null);
    setOpen(true);
  }


  async function onConfirmSubscribeCard() {
    console.log("[SUB] click confirm");
    setErr(null);
    setTokenizing(true);

    try {
        console.log("[SUB] mp key", window.__MP_PUBLIC_KEY__);
        console.log("[SUB] MercadoPago exists", !!window.MercadoPago);
      const mp = getMpInstance();
        console.log("[SUB] mp instance created");


      const tokenResp = await mp.createCardToken({
        cardNumber: cardNumber.replace(/\s+/g, ""),
        cardholderName,
        cardExpirationMonth: expirationMonth,
        cardExpirationYear: expirationYear,
        securityCode,
        identificationType: docType,
        identificationNumber: docNumber,
      });
          console.log("[SUB] token payload", { ...tokenResp, cardNumber: "***", securityCode: "***" });


      const cardTokenId: string | undefined = tokenResp?.id;
          console.log("[SUB] tokenResp", tokenResp);

      if (!cardTokenId) {
        const msg =
          tokenResp?.message ||
          tokenResp?.cause?.[0]?.description ||
          "No se pudo tokenizar la tarjeta.";
        throw new Error(msg);
      }

          console.log("[SUB] got cardTokenId", cardTokenId);


      setTokenizing(false);
      setLoadingCard(true);

      const r = await clientApp.billing.subscription.post({
        planKey,
        cardTokenId,
      });

          console.log("[SUB] subscription response", r);


      const data: any = r.data;
      if (!data?.ok) throw new Error(data?.message ?? "No se pudo crear la suscripción.");

      // ✅ En este flujo NO redirigimos. Queda pending hasta webhook.
      setOpen(false);
      onSubscribed?.();
    } catch (e: any) {
        console.error("[SUB] error raw", e);

      setErr(e?.message ?? "Error");
    } finally {
      setTokenizing(false);
      setLoadingCard(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-gray-900">{planName}</div>
          <div className="text-xs text-gray-600 mt-1">{priceLabel}</div>
        </div>

        {isCurrent ? (
          <span className="text-xs font-semibold rounded-full border border-gray-200 bg-white px-3 py-1">
            Actual
          </span>
        ) : null}
      </div>

      {subscriptionStatus === "trial" && typeof trialDaysLeft === "number" ? (
        <div className="mt-3 text-xs text-gray-700">
          Trial activo: <span className="font-semibold">{trialDaysLeft}</span> día(s) restantes.
        </div>
      ) : null}

      <div className="mt-4">
        <Button className="w-full" onClick={openModal} disabled={!canSubscribe || busy}>
          {subscriptionStatus === "pending"
            ? "Esperando confirmación..."
            : busy
              ? "Procesando..."
              : "Suscribirme"}
        </Button>

        {err ? <p className="mt-2 text-xs text-red-600">{err}</p> : null}

        {!canSubscribe && subscriptionStatus === "active" ? (
          <p className="mt-2 text-xs text-gray-600">Tu cuenta ya está activa.</p>
        ) : null}

        {!canSubscribe && subscriptionStatus === "pending" ? (
          <p className="mt-2 text-xs text-gray-600">
            Ya iniciamos tu suscripción. Se activará cuando Mercado Pago confirme (webhook).
          </p>
        ) : null}
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">Ingresa tu tarjeta</h2>
              <button
                className="text-zinc-500 hover:text-zinc-900"
                onClick={() => {
                  if (busy) return;
                  setOpen(false);
                }}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <p className="mt-1 text-sm text-zinc-600">
              Podés pagar con tu <span className="font-semibold">cuenta de Mercado Pago</span> (redirige) o con{" "}
              <span className="font-semibold">tarjeta</span> (tokenización).
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2">

              <div className="text-sm font-semibold text-zinc-900">Pagar con tarjeta</div>

              <Input
                placeholder="Número de tarjeta"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
              <Input
                placeholder="Nombre del titular"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Mes (MM)"
                  value={expirationMonth}
                  onChange={(e) => setExpirationMonth(e.target.value)}
                />
                <Input
                  placeholder="Año (YY o YYYY)"
                  value={expirationYear}
                  onChange={(e) => setExpirationYear(e.target.value)}
                />
              </div>

              <Input
                placeholder="Código de seguridad (CVV)"
                value={securityCode}
                onChange={(e) => setSecurityCode(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Tipo doc (DNI)" value={docType} onChange={(e) => setDocType(e.target.value)} />
                <Input placeholder="Número doc" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
              </div>

              {err ? <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</div> : null}

              <Button className="w-full" onClick={onConfirmSubscribeCard} disabled={busy}>
                {tokenizing ? "Validando tarjeta..." : loadingCard ? "Creando suscripción..." : "Confirmar con tarjeta"}
              </Button>

              <div className="text-xs text-zinc-500">
                Zuma+ no almacena tu tarjeta. Si todo OK, quedará <span className="font-semibold">pendiente</span> hasta
                confirmación (webhook).
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubscribeCard;
