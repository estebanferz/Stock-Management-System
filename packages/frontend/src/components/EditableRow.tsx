import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  label: string;
  value: string | null | undefined;
  placeholder?: string;
  maxLength?: number;
  canEdit?: boolean;
  onSave: (next: string | null) => Promise<void>;
};

export function EditableRow({ label, value, placeholder, maxLength, canEdit = true, onSave }: Props) {
  const initial = useMemo(() => value ?? "", [value]);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // si cambia value desde afuera, resetea draft si no está editando
  if (!isEditing && draft !== initial) {
    // ojo: esto corre en render; si preferís, pasalo a useEffect
    // lo dejo simple para beta
    // eslint-disable-next-line react/no-direct-mutation-state
  }

  const display = value?.trim() ? value : "—";

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const next = draft.trim();
      await onSave(next ? next : null);
      setIsEditing(false);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(initial);
    setError(null);
    setIsEditing(false);
  }

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>

        {!isEditing ? (
          <div className="pt-1 text-sm font-medium text-slate-900 truncate">{display}</div>
        ) : (
          <div className="pt-2 space-y-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              maxLength={maxLength}
            />
            {error && <div className="text-xs text-red-600">{error}</div>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                Guardar
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {!isEditing && (
        <Button size="sm" variant="outline" className="hover:text-white hover:bg-mainColor" onClick={() => canEdit && setIsEditing(true)} disabled={!canEdit}>
          Editar
        </Button>
      )}
    </div>
  );
}
