import { useMemo, useState } from "react";
import { clientApp } from "@/lib/clientAPI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
tenant: { id: number; name: string | null } | null;
roleInTenant: "owner" | "admin" | "staff" | string;
tenantSettings?: {
    business_name?: string | null;
    logo_url?: string | null;
    cuit?: string | null;
    address?: string | null;
    default_currency?: string | null;
    timezone?: string | null;
    low_stock_threshold_default?: number | null;
} | null;
};

function canEdit(roleInTenant: string) {
return roleInTenant === "owner" || roleInTenant === "admin";
}

export default function TenantSettingsForm({ tenant, roleInTenant, tenantSettings }: Props) {
    const editable = useMemo(() => canEdit(roleInTenant), [roleInTenant]);

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

    const [tenantName, setTenantName] = useState((tenant?.name ?? ""));

    const [form, setForm] = useState({
    business_name: tenantSettings?.business_name ?? "",
    logo_url: tenantSettings?.logo_url ?? "",
    cuit: tenantSettings?.cuit ?? "",
    address: tenantSettings?.address ?? "",
    default_currency: tenantSettings?.default_currency ?? "ARS",
    timezone: tenantSettings?.timezone ?? "America/Argentina/Buenos_Aires",
    low_stock_threshold_default: String(tenantSettings?.low_stock_threshold_default ?? 3),
    });

    async function onSave() {
        setLoading(true);
        setStatus(null);

    try {
        if (!tenant) {
            setStatus({ kind: "err", msg: "No se encontró el tenant actual." });
            return;
        }
        if (!editable) {
            setStatus({ kind: "err", msg: "No tenés permisos para editar la empresa." });
            return;
        }

        if (tenantName.trim() && tenantName.trim() !== (tenant.name ?? "").trim()) {
        await clientApp.tenant.name.put({ name: tenantName.trim() } as any);
        }

    // 2) upsert tenant_settings
    const low = Number(form.low_stock_threshold_default);
    const body = {
        business_name: form.business_name.trim() || null,
        logo_url: form.logo_url.trim() || null,
        cuit: form.cuit.trim() || null,
        address: form.address.trim() || null,
        default_currency: form.default_currency.trim() || "ARS",
        timezone: form.timezone.trim() || "America/Argentina/Buenos_Aires",
        low_stock_threshold_default: Number.isFinite(low) ? low : 3,
    };

    await clientApp.tenant.current.put(body as any);
    
    setStatus({ kind: "ok", msg: "Configuración de empresa guardada." });
    } catch (e) {
    setStatus({ kind: "err", msg: "Error al guardar configuración de empresa." });
    } finally {
    setLoading(false);
    }
}

return (
    <div className="grid gap-4">
    {!editable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Solo <span className="font-medium">owner/admin</span> puede editar la configuración del tenant.
        </div>
    )}

    <div className="grid gap-3 sm:grid-cols-2">

        <div className="grid gap-2">
        <Label>Nombre comercial</Label>
        <Input
            value={form.business_name}
            disabled={!editable}
            placeholder="Ej: Mi Empresa SRL"
            onChange={(e) => setForm((p) => ({ ...p, business_name: e.target.value }))}
        />
        </div>

        <div className="grid gap-2">
        <Label>Logo URL</Label>
        <Input
            value={form.logo_url}
            disabled={!editable}
            placeholder="https://..."
            onChange={(e) => setForm((p) => ({ ...p, logo_url: e.target.value }))}
        />
        </div>

        <div className="grid gap-2">
        <Label>CUIT</Label>
        <Input
            value={form.cuit}
            disabled={!editable}
            placeholder="30-xxxxxxxx-x"
            onChange={(e) => setForm((p) => ({ ...p, cuit: e.target.value }))}
        />
        </div>

        <div className="grid gap-2 sm:col-span-2">
        <Label>Dirección</Label>
        <Input
            value={form.address}
            disabled={!editable}
            placeholder="Calle, número, ciudad"
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
        />
        </div>

        <div className="grid gap-2">
        <Label>Moneda por defecto</Label>
        <Input
            value={form.default_currency}
            disabled={!editable}
            placeholder="ARS"
            onChange={(e) => setForm((p) => ({ ...p, default_currency: e.target.value }))}
        />
        </div>

        <div className="grid gap-2">
        <Label>Timezone</Label>
        <Input
            value={form.timezone}
            disabled={!editable}
            placeholder="America/Argentina/Buenos_Aires"
            onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
        />
        </div>

        <div className="grid gap-2">
        <Label>Low stock threshold (default)</Label>
        <Input
            type="number"
            value={form.low_stock_threshold_default}
            disabled={!editable}
            onChange={(e) => setForm((p) => ({ ...p, low_stock_threshold_default: e.target.value }))}
        />
        </div>
    </div>

    {status && (
        <div
        className={[
            "rounded-lg border p-3 text-sm",
            status.kind === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900",
        ].join(" ")}
        >
        {status.msg}
        </div>
    )}

    <div className="flex justify-end">
        <Button onClick={onSave} disabled={loading || !editable}>
        {loading ? "Guardando..." : "Guardar cambios"}
        </Button>
    </div>
    </div>
);
}
