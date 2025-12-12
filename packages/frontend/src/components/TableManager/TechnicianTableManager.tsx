import { useCallback } from "react";
import TableWrapper from "@/components/TableWrapper";
import { clientApp } from "@/lib/clientAPI";
import type { Technician } from "@server/db/schema";
import type { Column } from "../CustomTable";

interface TechnicianTableManagerProps {
    data: Technician[];
    columns: Column<Technician>[];
}

export function TechnicianTableManager({ data, columns }: TechnicianTableManagerProps) {

  const handleEdit = useCallback((row: Technician) => {
      const ev = new CustomEvent("open-edit-technician", { detail: row });
      window.dispatchEvent(ev);
  }, []);

  const handleDelete = useCallback(async (row: Technician) => {
      await clientApp.technician({ id: row.technician_id }).delete();
      window.location.reload();
  }, []);

  return (
    <TableWrapper
      data={data}
      columns={columns}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}