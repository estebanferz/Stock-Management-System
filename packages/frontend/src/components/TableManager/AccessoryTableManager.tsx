import { useCallback } from "react";
import TableWrapper from "@/components/TableWrapper";
import { clientApp } from "@/lib/clientAPI";
import type { Accessory,  } from "@server/db/schema";
import type { Column } from "../CustomTable";

interface AccessoryTableManagerProps {
    data: Accessory[];
    columns: Column<Accessory>[];
}

export function AccessoryTableManager({ data, columns }: AccessoryTableManagerProps) {

  const handleEdit = useCallback((row: Accessory) => {
      const ev = new CustomEvent("open-edit-accessory", { detail: row });
      window.dispatchEvent(ev);
  }, []);

  const handleDelete = useCallback(async (row: Accessory) => {
      await clientApp.accessory({ id: row.accessory_id }).delete();
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