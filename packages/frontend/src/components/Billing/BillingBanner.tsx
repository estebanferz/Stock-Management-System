import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";

type SubscriptionStatus =
  | "trial"
  | "inactive"
  | "pending"
  | "active"
  | "past_due"
  | "canceled"
  | string;

type Props = {
  subscriptionStatus?: SubscriptionStatus | null;
  trialEndsAt?: string | Date | null;
  currentPeriodEnd?: string | Date | null; // opcional (si lo tenés)
  billingHref?: string; // default: "/dashboard/billing"
  appName?: string; // default: "Zuma+"
};

function parseDate(d?: string | Date | null) {
  if (!d) return null;
  const dd = typeof d === "string" ? new Date(d) : d;
  return Number.isNaN(dd.getTime()) ? null : dd;
}

function daysLeftCeil(now: Date, end: Date) {
  const diffMs = end.getTime() - now.getTime();
  return Math.ceil(diffMs / 86400000);
}

type Variant = "info" | "warn" | "danger";

export function BillingBanner({
  subscriptionStatus,
  trialEndsAt,
  currentPeriodEnd,
  billingHref = "/dashboard/billing",
  appName = "Zuma+",
}: Props) {
  const now = new Date();

  const banner = useMemo(() => {
    const status = (subscriptionStatus ?? "inactive").toString().toLowerCase();

    // ACTIVE -> no mostramos nada
    if (status === "active") return null;

    // PENDING -> waiting webhook / autorización
    if (status === "pending") {
      return {
        variant: "info" as Variant,
        title: "Estamos confirmando tu suscripción",
        desc: "Tu pago está en proceso. Esto puede tardar unos minutos. Si no se actualiza, revisá en Facturación.",
        pill: "PENDIENTE",
        dateLabel: null as string | null,
        primaryCta: "Ver facturación",
        secondaryCta: "Actualizar",
        onSecondary: () => window.location.reload(),
      };
    }

    // PAST_DUE -> riesgo de corte
    if (status === "past_due") {
      const end = parseDate(currentPeriodEnd);
      const dateLabel = end
        ? `Vencimiento: ${end.toLocaleDateString("es-AR", { year: "numeric", month: "short", day: "2-digit" })}`
        : null;

      return {
        variant: "danger" as Variant,
        title: "Pago pendiente / suscripción vencida",
        desc: `Para evitar que se corte el acceso a ${appName}, regularizá el pago desde Facturación.`,
        pill: "PAGO PENDIENTE",
        dateLabel,
        primaryCta: "Regularizar",
        secondaryCta: "Ver detalles",
      };
    }

    // CANCELED -> se cortó / cancelada
    if (status === "canceled" || status === "cancelled") {
      return {
        variant: "danger" as Variant,
        title: "Tu suscripción está cancelada",
        desc: `Para volver a usar ${appName}, reactivá la suscripción.`,
        pill: "CANCELADA",
        dateLabel: null,
        primaryCta: "Reactivar",
        secondaryCta: "Ver detalles",
      };
    }

    // TRIAL -> tu lógica original, pero la mantenemos
    if (status === "trial") {
      const end = parseDate(trialEndsAt);

      if (!end) {
        return {
          variant: "warn" as Variant,
          title: "Tu prueba gratis está activa",
          desc: "No pudimos calcular la fecha de finalización. Revisá Facturación.",
          pill: "TRIAL",
          dateLabel: null,
          primaryCta: "Activar suscripción",
          secondaryCta: "Ver detalles",
        };
      }

      const left = daysLeftCeil(now, end);

      if (left <= 0) {
        return {
          variant: "danger" as Variant,
          title: "Tu prueba gratis terminó",
          desc: `Para seguir usando ${appName}, activá tu suscripción ahora.`,
          pill: "TRIAL FINALIZADO",
          dateLabel: `Venció: ${end.toLocaleDateString("es-AR", { year: "numeric", month: "short", day: "2-digit" })}`,
          primaryCta: "Activar suscripción",
          secondaryCta: "Ver detalles",
        };
      }

      if (left <= 2) {
        return {
          variant: "warn" as Variant,
          title: `⚠️ Te quedan ${left} día${left === 1 ? "" : "s"} de prueba`,
          desc: `Activá tu suscripción para no perder acceso a ${appName}.`,
          pill: "TRIAL",
          dateLabel: `Vence: ${end.toLocaleDateString("es-AR", { year: "numeric", month: "short", day: "2-digit" })}`,
          primaryCta: "Activar suscripción",
          secondaryCta: "Ver detalles",
        };
      }

      return {
        variant: "info" as Variant,
        title: `Te quedan ${left} días de prueba`,
        desc: "Aprovechá para cargar productos, registrar ventas y configurar tu negocio.",
        pill: "TRIAL",
        dateLabel: `Vence: ${end.toLocaleDateString("es-AR", { year: "numeric", month: "short", day: "2-digit" })}`,
        primaryCta: "Activar suscripción",
        secondaryCta: "Ver detalles",
      };
    }

    // INACTIVE u otros -> bloque suave (hasta que tu protectedController lo bloquee fuerte)
    return {
      variant: "warn" as Variant,
      title: "Tu cuenta necesita una suscripción",
      desc: `Activá tu suscripción para seguir usando ${appName}.`,
      pill: "SIN SUSCRIPCIÓN",
      dateLabel: null,
      primaryCta: "Activar suscripción",
      secondaryCta: "Ver detalles",
    };
  }, [subscriptionStatus, trialEndsAt, currentPeriodEnd, billingHref, appName]);

  if (!banner) return null;

  const styles =
    banner.variant === "danger"
      ? {
          wrap: "border-rose-200 bg-rose-50/30",
          title: "text-rose-900/80",
          desc: "text-rose-800/80",
          pill: "bg-rose-100 text-rose-900 ring-1 ring-rose-200",
          btnVariant: "default" as const,
        }
      : banner.variant === "warn"
      ? {
          wrap: "border-yellow-300 bg-yellow-100/30",
          title: "text-amber-900/80",
          desc: "text-amber-800/80",
          pill: "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
          btnVariant: "outline" as const,
        }
      : {
          wrap: "border-gray-300 bg-gray-100/50",
          title: "text-zinc-900/80",
          desc: "text-zinc-700/80",
          pill: "bg-zinc-100 text-zinc-900 ring-1 ring-zinc-200",
          btnVariant: "outline" as const,
        };

  return (
    <div className="sticky top-0 z-10 mb-4">
      <div className={`rounded-2xl border-2 ${styles.wrap} p-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className={`font-bold text-md ${styles.title}`}>{banner.title}</div>
            <div className={`mt-1 text-xs ${styles.desc}`}>{banner.desc}</div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles.pill}`}>
                {banner.pill}
              </span>
              {banner.dateLabel ? <span className="text-xs text-zinc-600">{banner.dateLabel}</span> : null}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <a href={billingHref} className="w-full sm:w-auto">
              <Button className="w-full" variant={styles.btnVariant}>
                {banner.primaryCta}
              </Button>
            </a>

            {banner.secondaryCta ? (
              <Button
                className="w-full sm:w-auto"
                variant="ghost"
                onClick={banner.onSecondary ?? (() => (window.location.href = billingHref))}
              >
                {banner.secondaryCta}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillingBanner;
