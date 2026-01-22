import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditableRow } from "./EditableRow";
import { EditableSwitchRow } from "./EditableSwitchRow";
import { CurrencyButtonsRow } from "@/components/CurrencyButtonRow";
import { clientApp } from "@/lib/clientAPI";
import { LogoRow } from "./LogoRow";

type Props = {
  initial: {
    user: any;
    userSettings: any | null;
    tenant: any;
    tenantSettings: any | null;
    roleInTenant: "owner" | "admin" | "staff";
  };
};

export default function ProfileEditor({ initial }: Props) {
    const [userSettings, setUserSettings] = useState(initial.userSettings ?? null);

    const [tenant, setTenant] = useState(initial.tenant);
    const [tenantSettings, setTenantSettings] = useState(initial.tenantSettings);

    const canEditTenant = initial.roleInTenant === "owner" || initial.roleInTenant === "admin";

    async function patchUserSettings(patch: any) {
        const res = await clientApp.user.me["settings"].patch(patch); // ajusta path según tu client
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
    <div className="grid gap-6">
      <Card className="rounded-2xl shadow-sm">
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

      <Card className="rounded-2xl shadow-sm">
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

          <EditableSwitchRow
            label="Notificaciones por email"
            value={userSettings?.email_notifications}
            onSave={(v) => patchUserSettings({ email_notifications: v })}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
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

            <EditableRow
                label="CUIT"
                value={tenantSettings?.cuit}
                maxLength={32}
                canEdit={canEditTenant}
                onSave={(v) => patchTenantSettings({ cuit: v })}
            />

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

            <EditableRow
                label="Stock mínimo"
                value={String(tenantSettings?.low_stock_threshold_default ?? 3)}
                canEdit={canEditTenant}
                onSave={(v) => {
                const n = Number(v);
                if (!Number.isFinite(n)) throw new Error("Debe ser un número.");
                return patchTenantSettings({ low_stock_threshold_default: n });
                }}
            />
        </CardContent>
      </Card>
    </div>
  );
}
