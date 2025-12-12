import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export type ActionMode = "edit" | "delete" | null;

export interface ActionPanelProps {
  // ya no necesitamos props; es autónomo (emite eventos)
}

export const ActionPanel: React.FC<ActionPanelProps> = () => {
  const [mode, setMode] = useState<ActionMode>(null);

  // Emitir evento al cambiar modo
  useEffect(() => {
    const ev = new CustomEvent("action-mode-change", { detail: mode });
    window.dispatchEvent(ev);
  }, [mode]);

  return (
    <div className="p-4 rounded-xl shadow-lg bg-white border flex flex-col gap-4 sticky top-[var(--header-height)]">
      <h2 className="text-lg font-semibold text-center">Acciones</h2>

      <Button
        variant={mode === "edit" ? "default" : "outline"}
        className="flex items-center gap-2"
        onClick={() => setMode((m) => (m === "edit" ? null : "edit"))}
      >
        Editar
      </Button>

      <Button
        variant={mode === "delete" ? "destructive" : "outline"}
        className="flex items-center gap-2"
        onClick={() => setMode((m) => (m === "delete" ? null : "delete"))}
      >
        Eliminar
      </Button>
    </div>
  );
};

export default ActionPanel;
