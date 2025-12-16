import { useCallback } from "react";
import TableWrapper from "@/components/TableWrapper";
import { clientApp } from "@/lib/clientAPI";
import type { Repair } from "@server/db/schema";
import type { Column } from "../CustomTable";

interface RepairTableManagerProps {
    data: Repair[];
    columns: Column<Repair>[];
}

export function RepairTableManager({ data, columns }: RepairTableManagerProps) {

  const handleEdit = useCallback((row: Repair) => {
      const ev = new CustomEvent("open-edit-repair", { detail: row });
      window.dispatchEvent(ev);
  }, []);

  const handleDelete = useCallback(async (row: Repair) => {
      await clientApp.repair({ id: row.repair_id }).delete();
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