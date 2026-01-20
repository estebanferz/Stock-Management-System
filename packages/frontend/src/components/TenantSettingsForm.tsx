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

    const [logoUploading, setLogoUploading] = useState(false);

    const currentLogo =
    (form.logo_url?.trim() ? form.logo_url : null) ||
    "/logo-apple-mdp.jpg";

    async function onLogoPick(file: File) {
    if (!editable) return;

    setLogoUploading(true);
    setStatus(null);

    try {
        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch("/api/tenant/logo", {
        method: "POST",
        body: fd,
        credentials: "include",
        // NO pongas headers Content-Type acá: el browser lo setea con boundary
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
        throw new Error(data.detail || data.error || `Upload failed (${res.status})`);
        }

        setForm((p) => ({ ...p, logo_url: data.logo_url }));
        setStatus({ kind: "ok", msg: "Logo actualizado. No te olvides de guardar cambios." });
    } catch (e: any) {
        setStatus({ kind: "err", msg: e?.message || "Error al subir el logo." });
    } finally {
        setLogoUploading(false);
    }
    }


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
        <Label>Logo de la empresa</Label>

        <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full border bg-white overflow-hidden flex items-center justify-center">
            <img
                src={currentLogo}
                alt="Logo"
                className="h-full w-full object-contain"
            />
            </div>

            <div className="flex flex-col gap-2">
                <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={!editable || logoUploading}
                    onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onLogoPick(file);
                    }}
                />

                <p className="text-xs text-gray-500">
                    PNG/JPG/WEBP, máx 2MB. Se actualiza al seleccionar.
                </p>
                </div>
            </div>
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
