import { useCallback } from "react";
import TableWrapper from "@/components/TableWrapper";
import { clientApp } from "@/lib/clientAPI";
import type { Provider } from "@server/db/schema";
import type { Column } from "../CustomTable";

interface ProviderTableManagerProps {
    data: Provider[];
    columns: Column<Provider>[];
}

export function ProviderTableManager({ data, columns }: ProviderTableManagerProps) {

  const handleEdit = useCallback((row: Provider) => {
      const ev = new CustomEvent("open-edit-provider", { detail: row });
      window.dispatchEvent(ev);
  }, []);

  const handleDelete = useCallback(async (row: Provider) => {
      await clientApp.provider({ id: row.provider_id }).delete();
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