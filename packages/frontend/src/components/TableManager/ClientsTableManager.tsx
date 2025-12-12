import { useCallback } from "react";
import TableWrapper from "@/components/TableWrapper";
import { clientApp } from "@/lib/clientAPI";
import type { Client } from "@server/db/schema";
import type { Column } from "../CustomTable";

interface ClientsTableManagerProps {
    data: Client[];
    columns: Column<Client>[];
}

export function ClientsTableManager({ data, columns }: ClientsTableManagerProps) {

  const handleEdit = useCallback((row: Client) => {
      const ev = new CustomEvent("open-edit-client", { detail: row });
      window.dispatchEvent(ev);
  }, []);

  const handleDelete = useCallback(async (row: Client) => {
      await clientApp.client({ id: row.client_id }).delete();
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