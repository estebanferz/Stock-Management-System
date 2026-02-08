import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditableRow } from "./EditableRow";
// import { EditableSwitchRow } from "./EditableSwitchRow";
import { CurrencyButtonsRow } from "@/components/CurrencyButtonRow";
import { clientApp } from "@/lib/clientAPI";
import { LogoRow } from "./LogoRow";
import { Button } from "./ui/button";

type Props = {
  initial: {
    user: any;
    userSettings: any | null;
    tenant: any;
    tenantSettings: any | null;
    roleInTenant: "owner" | "admin" | "staff";
  };
};

function fmtDateAR(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" });
}

type BillingPlan = {
  plan_id: number;
  key: string;
  name: string;
  price_amount: string | number;
  currency: string;
  is_active: boolean;
};

type IsoDateLike = string | Date;

type BillingStatusResp = {
  ok: boolean;
  tenant: {
    subscription_status: string | null;
    trial_ends_at: IsoDateLike | null;
    subscription_plan_id: number | null;
    mp_preapproval_id: string | null;
    current_period_end: IsoDateLike | null;
  } | null;
  plans: BillingPlan[];
  now: string;
};

function statusLabel(s?: string | null) {
  switch (s) {
    case "active": return "Activa";
    case "pending": return "Pendiente";
    case "past_due": return "Pago rechazado";
    case "canceled": return "Cancelada";
    case "trial": return "Trial";
    case "inactive":
    default: return "Inactiva";
  }
}

function statusBadgeVariant(s?: string | null): "default" | "secondary" | "destructive" | "outline" {
  switch (s) {
    case "active": return "default";
    case "pending": return "secondary";
    case "past_due": return "destructive";
    case "canceled": return "outline";
    case "trial": return "secondary";
    default: return "outline";
  }
}

export default function ProfileEditor({ initial }: Props) {
    const [userSettings, setUserSettings] = useState(initial.userSettings ?? null);

    const [tenant, setTenant] = useState(initial.tenant);
    const [tenantSettings, setTenantSettings] = useState(initial.tenantSettings);
    const [billingLoading, setBillingLoading] = useState(false);
    const [billingError, setBillingError] = useState<string | null>(null);
    const [billing, setBilling] = useState<BillingStatusResp | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);

    const canEditTenant = initial.roleInTenant === "owner" || initial.roleInTenant === "admin";
    
    async function refreshBilling() {
      setBillingError(null);
      setBillingLoading(true);
      try {
        const res = await clientApp.billing.status.get();
        setBilling(res.data);
      } catch (e: any) {
        setBillingError(e?.message ?? "No se pudo cargar el estado de suscripción.");
      } finally {
        setBillingLoading(false);
      }
    }

    useEffect(() => {
      refreshBilling();
    }, []);

    const sub = billing?.tenant;
    const subStatus = (sub?.subscription_status ?? "inactive") as string;

    const plan = useMemo(() => {
      if (!billing?.tenant?.subscription_plan_id) return null;
      return (
        billing.plans.find(
          p => p.plan_id === billing.tenant!.subscription_plan_id
        ) ?? null
      );
    }, [billing]);
    
    const canCancel =
      canEditTenant &&
      (subStatus === "active" || subStatus === "pending" || subStatus === "past_due") &&
      !!sub?.mp_preapproval_id;

    async function onCancelSubscription() {
      if (!canCancel) return;
      setCancelLoading(true);
      try {
        const r = await clientApp.billing.cancel.post();
        if (!(r.data as any)?.ok) throw new Error((r.data as any)?.message ?? "No se pudo cancelar");
        await refreshBilling();
      } finally {
        setCancelLoading(false);
      }
    }

    async function patchUserSettings(patch: any) {
        const res = await clientApp.user.me["settings"].patch(patch);
        setUserSettings(res.data);
    }

    async function onLogoPick(file: File): Promise<string> {
    if (!canEditTenant) {
        throw new Error("No autorizado para cambiar el logo.");
    }

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/tenant/logo", {
        method: "POST",
        body: fd,
        credentials: "include",
    });

    const data: any = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok) {
        throw new Error(data?.detail || data?.error || `Upload failed (${res.status})`);
    }

    const nextUrl = data.logo_url;
    if (typeof nextUrl !== "string" || !nextUrl.trim()) {
        throw new Error("El backend no devolvió logo_url.");
    }

    setTenantSettings((p: any) => ({ ...(p ?? {}), logo_url: nextUrl }));

    return nextUrl;
    }

    async function patchTenantSettings(patch: any) {
        const res = await clientApp.tenant.me["settings"].patch(patch); // idem
        setTenantSettings(res.data);
    }

  const businessName = useMemo(() => {
    return tenantSettings?.business_name?.trim() || tenant?.name?.trim() || "Empresa sin nombre";
  }, [tenantSettings, tenant]);

  return (
    <>

    <div className="grid gap-6">
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
          <CardDescription>Datos rápidos</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="outline">{initial.user?.email ?? "—"}</Badge>
          <Badge variant="outline">Rol: {initial.roleInTenant}</Badge>
          <Badge variant="outline">{businessName}</Badge>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle>Cuenta</CardTitle>
          <CardDescription>Datos del usuario</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <EditableRow
            label="Nombre a mostrar"
            value={userSettings?.display_name}
            maxLength={120}
            placeholder="Ej: Tomás"
            onSave={(v) => patchUserSettings({ display_name: v })}
          />

          <EditableRow
            label="Teléfono"
            value={userSettings?.phone}
            maxLength={32}
            placeholder="Ej: +54 9 223 ..."
            onSave={(v) => patchUserSettings({ phone: v })}
          />

          {/* <EditableSwitchRow
            label="Notificaciones por email"
            value={userSettings?.email_notifications}
            onSave={(v) => patchUserSettings({ email_notifications: v })}
          /> */}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle>Empresa</CardTitle>
          <CardDescription>Configuración del tenant</CardDescription>
        </CardHeader>

        <CardContent className="divide-y">
            <LogoRow
                businessName={businessName}
                logoUrl={tenantSettings?.logo_url}
                canEdit={canEditTenant}
                onUpload={onLogoPick}
            />

            <EditableRow
                label="Nombre comercial"
                value={tenantSettings?.business_name}
                maxLength={255}
                canEdit={canEditTenant}
                onSave={(v) => patchTenantSettings({ business_name: v })}
            />

            {/* <EditableRow
                label="CUIT"
                value={tenantSettings?.cuit}
                maxLength={32}
                canEdit={canEditTenant}
                onSave={(v) => patchTenantSettings({ cuit: v })}
            /> */}

            <EditableRow
                label="Dirección"
                value={tenantSettings?.address}
                maxLength={255}
                canEdit={canEditTenant}
                onSave={(v) => patchTenantSettings({ address: v })}
            />

            <CurrencyButtonsRow
                label="Moneda"
                value={tenantSettings?.display_currency}
                canEdit={canEditTenant}
                onSave={(next) => patchTenantSettings({ display_currency: next })}
            />

            {/* <EditableRow
                label="Stock mínimo"
                value={String(tenantSettings?.low_stock_threshold_default ?? 3)}
                canEdit={canEditTenant}
                onSave={(v) => {
                const n = Number(v);
                if (!Number.isFinite(n)) throw new Error("Debe ser un número.");
                return patchTenantSettings({ low_stock_threshold_default: n });
                }}
            /> */}
        </CardContent>
      </Card>
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle>Suscripción</CardTitle>
          <CardDescription>Estado de MercadoPago para esta empresa</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {!billing && billingLoading ? (
            <div className="text-sm text-muted-foreground">Cargando...</div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 flex-row">
                <div className="w-1/3 flex items-center justify-center text-slate-800 font-bold ">
                    {statusLabel(subStatus)}
                </div>

                <div className="border border-r-neutral-700 h-12" />

                <div className="flex flex-col text-sm font-semibold text-slate-700">
                  {plan ? (
                      `Plan: ${plan.name} (${String(plan.price_amount)} ${String(plan.currency)})`
                  ) : (
                      "Plan: —"
                  )}

                  <div className="text-xs text-slate-500">
                    Próximo período: {sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("es-AR") : "—"}
                  </div>
                </div>
              </div>


              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={refreshBilling}
                  disabled={billingLoading}
                >
                  Recargar
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onCancelSubscription}
                  disabled={!canCancel || cancelLoading}
                  title={!canEditTenant ? "Solo owner/admin" : undefined}
                >
                  {cancelLoading ? "Cancelando..." : "Cancelar suscripción"}
                </Button>
              </div>

              {!canEditTenant && (
                <div className="text-xs text-muted-foreground">
                  Solo owner/admin puede cancelar la suscripción.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  </>
  );
}