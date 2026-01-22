import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type Props = {
  label: string;
  value: boolean | null | undefined;
  canEdit?: boolean;
  onSave: (next: boolean) => Promise<void>;
};

export function EditableSwitchRow({ label, value, canEdit = true, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const checked = value ?? false;

  async function toggle() {
    if (!canEdit) return;
    setSaving(true);
    try {
      await onSave(!checked);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={checked} onCheckedChange={toggle} disabled={!canEdit || saving} />
      </div>
    </div>
  );
}
