import { useEffect, useMemo, useState } from "react";
import { clientApp } from "@/lib/clientAPI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  user: { id: number; email: string; role?: string | null };
  roleInTenant: string;
};

type UserSettings = {
  display_name: string | null;
  phone: string | null;
  email_notifications: boolean;
};

function safeData(res: any) {
  return res?.data ?? res;
}

export default function UserSettingsForm({ roleInTenant }: Props) {
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const [form, setForm] = useState<UserSettings>({
    display_name: null,
    phone: null,
    email_notifications: true,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await clientApp.user.me.get();
        const payload = safeData(res);

        const s = payload?.userSettings;

        if (!alive) return;

        if (s) {
          setForm({
            display_name: s.display_name ?? null,
            phone: s.phone ?? null,
            email_notifications: Boolean(s.email_notifications),
          });
        }

        setInitialLoaded(true);
      } catch {
        if (!alive) return;
        setInitialLoaded(true);
        setStatus({ kind: "err", msg: "No se pudo cargar la configuración del usuario." });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const dirty = useMemo(() => {
    // Permitimos guardar igual; el backend hace upsert.
    return initialLoaded;
  }, [initialLoaded]);

  async function onSave() {
    setLoading(true);
    setStatus(null);
    try {
      const body = {
        display_name: form.display_name,
        phone: form.phone,
        email_notifications: form.email_notifications,
      };

      await clientApp.user.me.put(body as any);

      setStatus({ kind: "ok", msg: "Guardado." });
    } catch {
      setStatus({ kind: "err", msg: "Error al guardar cambios." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Nombre visible</Label>
          <Input
            value={form.display_name ?? ""}
            placeholder="Ej: Tomás"
            onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value || null }))}
          />
        </div>

        <div className="grid gap-2">
          <Label>Teléfono</Label>
          <Input
            value={form.phone ?? ""}
            placeholder="Ej: +54 9 223 ..."
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value || null }))}
          />
        </div>

        <div className="grid gap-2 sm:col-span-2">
          <Label>Notificaciones por email</Label>
          <div className="flex items-center gap-2 rounded-md border p-3">
            <input
              type="checkbox"
              checked={form.email_notifications}
              onChange={(e) => setForm((p) => ({ ...p, email_notifications: e.target.checked }))}
            />
            <span className="text-sm text-slate-700">Recibir notificaciones al correo</span>
          </div>
        </div>
      </div>

      {status && (
        <div
          className={[
            "rounded-lg border p-3 text-sm",
            status.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900",
          ].join(" ")}
        >
          {status.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Tu rol en la empresa: <span className="font-medium">{roleInTenant}</span>
        </div>

        <Button onClick={onSave} disabled={loading || !dirty}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}
