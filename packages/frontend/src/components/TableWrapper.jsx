import { useState, useEffect } from "react";
import { CustomTable } from "@/components/CustomTable";

export default function TableWrapper({ data, columns, onEdit, onDelete }) {
  const [actionMode, setActionMode] = useState(null);

  useEffect(() => {
    const onChange = (e) => {
      setActionMode(e.detail ?? null);
    };

    window.addEventListener("action-mode-change", onChange);

    return () => window.removeEventListener("action-mode-change", onChange);
  }, []);

  return (
    <div>
      <CustomTable
        data={data}
        columns={columns}
        isActionMode={!!actionMode}
        onEdit={actionMode === "edit" ? (row) => onEdit?.(row) : undefined}
        onDelete={actionMode === "delete" ? (row) => onDelete?.(row) : undefined}
      />
    </div>
  );
}
