import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clientApp } from "@/lib/clientAPI";

declare global {
  interface Window {
    MercadoPago?: any;
    __MP_PUBLIC_KEY__?: string;
  }
}

type Plan = {
  plan_id: number;
  key: string;
  name: string;
  price_amount: any;
  currency: any;
  is_active: boolean;
};

type Props = {
  plans: Plan[];
  currentPlanId: number | null;

  subscriptionStatus: "trial" | "inactive" | "pending" | "active" | "past_due" | "canceled";
  trialDaysLeft: number | null;

  nowIso: string;
  tenantName?: string;
};

const onlyDigits = (v: string) => v.replace(/\D+/g, "");

const limitLen = (v: string, len: number) => v.slice(0, len);

function isValidMonth(mm: string) {
  const n = Number(mm);
  return mm.length === 2 && n >= 1 && n <= 12;
}

function isValidYear(yy: string) {
  if (!(yy.length === 2 || yy.length === 4)) return false;
  const year = yy.length === 2 ? 2000 + Number(yy) : Number(yy);
  return year >= new Date().getFullYear();
}

function isValidCvv(v: string) {
  return v.length === 3 || v.length === 4;
}

export function SubscribeCard({
  plans,
  currentPlanId,
  subscriptionStatus,
  trialDaysLeft,
}: Props) {
  const [selectedPlanKey, setSelectedPlanKey] = useState<string | null>(null);

  const [loadingCard, setLoadingCard] = useState(false);
  const [tokenizing, setTokenizing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // fields tarjeta
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [docType, setDocType] = useState("DNI");
  const [docNumber, setDocNumber] = useState("");

  const busy = loadingCard || tokenizing;

  const canSubscribe = useMemo(() => {
    if (subscriptionStatus === "active") return false;
    if (subscriptionStatus === "pending") return false;
    return true;
  }, [subscriptionStatus]);

  const activePlans = useMemo(
    () => plans.filter((p) => p.is_active),
    [plans]
  );

  const selectedPlan = useMemo(
    () => activePlans.find((p) => p.key === selectedPlanKey) ?? null,
    [activePlans, selectedPlanKey]
  );

  const fmtMoney = (amount: any, currency: any) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: String(currency ?? "ARS"),
      maximumFractionDigits: 2,
    }).format(Number(amount ?? 0));

  function getMpInstance() {
    const key = window.__MP_PUBLIC_KEY__;
    if (!key) throw new Error("Falta PUBLIC_MP_PUBLIC_KEY (window.__MP_PUBLIC_KEY__).");
    if (!window.MercadoPago) throw new Error("Mercado Pago SDK no cargó (MercadoPago undefined).");
    return new window.MercadoPago(key);
  }

  function openInlineForm(planKey: string) {
    setErr(null);
    setSelectedPlanKey(planKey);

    // opcional: si querés limpiar inputs al abrir
    // setCardNumber(""); setCardholderName(""); ...
  }

  function closeInlineForm() {
    if (busy) return;
    setSelectedPlanKey(null);
    setErr(null);
  }

  function validateForm(): string | null {
    if (!cardNumber || cardNumber.length < 13) return "Número de tarjeta inválido";
    if (!cardholderName.trim()) return "Nombre del titular requerido";
    if (!isValidMonth(expirationMonth)) return "Mes de expiración inválido";
    if (!isValidYear(expirationYear)) return "Año de expiración inválido";
    if (!isValidCvv(securityCode)) return "CVV inválido";
    if (!docNumber) return "Número de documento requerido";

    return null;
  }

  async function onConfirmSubscribeCard() {
    if (!selectedPlanKey) return;

    const validationError = validateForm();
    if (validationError) {
      setErr(validationError);
      return;
    }
    setErr(null);
    setTokenizing(true);

    try {
      const mp = getMpInstance();

      const tokenResp = await mp.createCardToken({
        cardNumber: cardNumber.replace(/\s+/g, ""),
        cardholderName,
        cardExpirationMonth: expirationMonth,
        cardExpirationYear: expirationYear,
        securityCode,
        identificationType: docType,
        identificationNumber: docNumber,
      });

      const cardTokenId: string | undefined = tokenResp?.id;

      if (!cardTokenId) {
        const msg =
          tokenResp?.message ||
          tokenResp?.cause?.[0]?.description ||
          "No se pudo tokenizar la tarjeta.";
        throw new Error(msg);
      }

      setTokenizing(false);
      setLoadingCard(true);

      const r = await clientApp.billing.subscription.post({
        planKey: selectedPlanKey,
        cardTokenId,
      });

      const data: any = r.data;
      if (!data?.ok) throw new Error(data?.message ?? "No se pudo crear la suscripción.");

      // cerrás panel y mostrás estado
      setSelectedPlanKey(null);
    } catch (e: any) {
      console.error("[SUB] error raw", e);
      setErr(e?.message ?? "Error");
    } finally {
      setTokenizing(false);
      setLoadingCard(false);
    }
  }

  const formComplete =
  cardNumber &&
  cardholderName &&
  expirationMonth.length === 2 &&
  expirationYear.length === 2 &&
  securityCode.length >= 3 &&
  docNumber;

  return (
    <div className="bg-white rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">Planes</div>
          <div className="text-xs text-gray-600 mt-1">
            Elegí un plan para continuar usando Zuma+.
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {activePlans.map((p) => {
          const isCurrent = Boolean(currentPlanId && p.plan_id === currentPlanId);

          return (
            <div key={p.plan_id} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-gray-900">{p.name}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {fmtMoney(p.price_amount, p.currency)} / mes
                  </div>
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
                <Button
                  className="w-full rounded-full bg-black text-white hover:bg-gray-100 hover:text-black"
                  variant="outline"
                  onClick={() => openInlineForm(String(p.key))}
                  disabled={!canSubscribe || busy}
                >
                  {subscriptionStatus === "pending"
                    ? "Esperando confirmación..."
                    : busy && selectedPlanKey === p.key
                      ? "Procesando..."
                      : "Suscribirme"}
                </Button>

                {!canSubscribe && subscriptionStatus === "active" ? (
                  <p className="mt-2 text-xs text-gray-600">Tu cuenta ya está activa.</p>
                ) : null}

                {!canSubscribe && subscriptionStatus === "pending" ? (
                  <p className="mt-2 text-xs text-gray-600">
                    Ya iniciamos tu suscripción. Se activará cuando Mercado Pago confirme (webhook).
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlan ? (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-zinc-900">
                Pagar con tarjeta — {selectedPlan.name}
              </div>
              <div className="text-xs text-zinc-600 mt-1">
                {fmtMoney(selectedPlan.price_amount, selectedPlan.currency)} / mes
              </div>
            </div>

            <button
              className="text-zinc-500 hover:text-zinc-900"
              onClick={closeInlineForm}
              disabled={busy}
              aria-label="Cerrar"
              type="button"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <Input
              className="rounded-xl border-gray-400"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Número de tarjeta"
              value={cardNumber}
              onChange={(e) =>
                setCardNumber(limitLen(onlyDigits(e.target.value), 19))
              }
              required
            />

            <Input
              className="rounded-xl border-gray-400"
              placeholder="Nombre del titular"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                className="rounded-xl border-gray-400"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Mes (MM)"
                value={expirationMonth}
                onChange={(e) =>
                  setExpirationMonth(limitLen(onlyDigits(e.target.value), 2))
                }
                required
              />
              <Input
                className="rounded-xl border-gray-400"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Año (YY)"
                value={expirationYear}
                onChange={(e) =>
                  setExpirationYear(limitLen(onlyDigits(e.target.value), 2))
                }
                required
              />
            </div>

            <Input
              className="rounded-xl border-gray-400"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Código de seguridad (CVV)"
              value={securityCode}
              onChange={(e) =>
                setSecurityCode(limitLen(onlyDigits(e.target.value), 4))
              }
              required
            />

            <div className="grid grid-cols-4">
              <div
                className="bg-neutral-500 text-white flex items-center justify-center col-span-1 rounded-l-xl"
              > DNI </div>
              <Input
                className="rounded-r-xl border-gray-400 col-span-3"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Número doc"
                value={docNumber}
                onChange={(e) =>
                  setDocNumber(limitLen(onlyDigits(e.target.value), 11))
                }
                required
              />
            </div>

            {err ? <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{err}</div> : null}

            <Button className="w-full rounded-full bg-black text-white hover:bg-gray-100 hover:text-black" onClick={onConfirmSubscribeCard}   disabled={busy || !formComplete}>
              {tokenizing ? "Validando tarjeta..." : loadingCard ? "Creando suscripción..." : "Confirmar con tarjeta"}
            </Button>

            <div className="text-xs text-zinc-500">
              Zuma+ no almacena tu tarjeta.
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 text-xs text-gray-500">
        * La activación puede demorar unos minutos en reflejarse.
      </div>
    </div>
  );
}

export default SubscribeCard;
