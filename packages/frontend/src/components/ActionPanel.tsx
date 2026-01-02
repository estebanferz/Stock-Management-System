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
    <div className="md:w-20 lg:w-full p-4 rounded-xl md:shadow-lg bg-white md:border flex flex-row md:flex-col gap-4 sticky top-[var(--header-height)]">
      <h2 className="text-lg font-semibold text-center hidden lg:block">Acciones</h2>

      <Button
        variant={mode === "edit" ? "default" : "outline"}
        className="flex items-center gap-2 hidden lg:block"
        onClick={() => setMode((m) => (m === "edit" ? null : "edit"))}
      >
        Editar
      </Button>
      
      <Button
        variant={mode === "edit" ? "default" : "outline"}
        className="gap-2 block lg:hidden w-12"
        onClick={() => setMode((m) => (m === "edit" ? null : "edit"))}
      >
        <svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M22.94,1.061c-1.368-1.367-3.76-1.365-5.124,0L1.611,17.265c-1.039,1.04-1.611,2.421-1.611,3.89v2.346c0,.276,.224,.5,.5,.5H2.846c1.47,0,2.851-.572,3.889-1.611L22.86,6.265c.579-.581,.953-1.262,1.08-1.972,.216-1.202-.148-2.381-1-3.232ZM6.028,21.682c-.85,.851-1.979,1.318-3.182,1.318H1v-1.846c0-1.202,.468-2.332,1.318-3.183L15.292,4.999l3.709,3.709L6.028,21.682ZM22.956,4.116c-.115,.642-.5,1.138-.803,1.441l-2.444,2.444-3.709-3.709,2.525-2.525c.986-.988,2.718-.99,3.709,0,.617,.617,.88,1.473,.723,2.349Z"/>
        </svg>
      </Button>

      <Button
        variant={mode === "delete" ? "destructive" : "outline"}
        className="flex items-center gap-2 hidden lg:block"
        onClick={() => setMode((m) => (m === "delete" ? null : "delete"))}
      >
        Eliminar
      </Button>

      <Button
        variant={mode === "delete" ? "destructive" : "outline"}
        className="gap-2 block lg:hidden w-12"
        onClick={() => setMode((m) => (m === "delete" ? null : "delete"))}
      >
        <svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M21.5,4h-3.551c-.252-2.244-2.139-4-4.449-4h-3c-2.31,0-4.197,1.756-4.449,4H2.5c-.276,0-.5,.224-.5,.5s.224,.5,.5,.5h1.5v14.5c0,2.481,2.019,4.5,4.5,4.5h7c2.481,0,4.5-2.019,4.5-4.5V5h1.5c.276,0,.5-.224,.5-.5s-.224-.5-.5-.5ZM10.5,1h3c1.758,0,3.204,1.308,3.449,3H7.051c.245-1.692,1.691-3,3.449-3Zm8.5,18.5c0,1.93-1.57,3.5-3.5,3.5h-7c-1.93,0-3.5-1.57-3.5-3.5V5h14v14.5ZM10,10.5v7c0,.276-.224,.5-.5,.5s-.5-.224-.5-.5v-7c0-.276,.224-.5,.5-.5s.5,.224,.5,.5Zm5,0v7c0,.276-.224,.5-.5,.5s-.5-.224-.5-.5v-7c0-.276,.224-.5,.5-.5s.5,.224,.5,.5Z"/>
        </svg>
      </Button>
    </div>
  );
};

export default ActionPanel;
