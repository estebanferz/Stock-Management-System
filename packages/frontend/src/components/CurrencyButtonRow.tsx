import { useState } from "react";
import { Button } from "@/components/ui/button";

type Currency = "ARS" | "USD" | "EUR" | "BRL";

type Props = {
  label?: string;
  value: string | null | undefined;
  canEdit?: boolean;
  onSave: (next: Currency) => Promise<void>;
};

const OPTIONS: Currency[] = ["ARS", "USD", "EUR", "BRL"];

export function CurrencyButtonsRow({
  label = "Moneda",
  value,
  canEdit = true,
  onSave,
}: Props) {
  const current = (OPTIONS.includes(value as Currency) ? (value as Currency) : "ARS");
  const [saving, setSaving] = useState<Currency | null>(null);

  async function handlePick(next: Currency) {
    if (!canEdit) return;
    if (next === current) return;

    setSaving(next);
    try {
      await onSave(next);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {OPTIONS.map((c) => {
          const active = c === current;
          const busy = saving === c;

          return (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              onClick={() => handlePick(c)}
              disabled={!canEdit || saving !== null}
              aria-pressed={active}
            >
              {busy ? "Guardando..." : c}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
