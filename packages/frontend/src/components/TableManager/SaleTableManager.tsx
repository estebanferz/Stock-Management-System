import { useCallback } from "react";
import TableWrapper from "@/components/TableWrapper";
import { clientApp } from "@/lib/clientAPI";
import type { Sale } from "@server/db/schema";
import type { Column } from "../CustomTable";

interface SaleTableManagerProps {
    data: Sale[];
    columns: Column<Sale>[];
}

export function SaleTableManager({ data, columns }: SaleTableManagerProps) {

  const handleEdit = useCallback((row: Sale) => {
        console.log("ENTRA HANDLEEDIT")
      const ev = new CustomEvent("open-edit-sale", { detail: row });
      window.dispatchEvent(ev);
  }, []);

  const handleDelete = useCallback(async (row: Sale) => {
      await clientApp.sale({ id: row.sale_id }).delete();
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