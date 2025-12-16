import { useCallback } from "react";
import TableWrapper from "@/components/TableWrapper";
import { clientApp } from "@/lib/clientAPI";
import type { Seller } from "@server/db/schema";
import type { Column } from "../CustomTable";

interface SellerTableManagerProps {
    data: Seller[];
    columns: Column<Seller>[];
}

export function SellerTableManager({ data, columns }: SellerTableManagerProps) {

  const handleEdit = useCallback((row: Seller) => {
      const ev = new CustomEvent("open-edit-seller", { detail: row });
      window.dispatchEvent(ev);
  }, []);

  const handleDelete = useCallback(async (row: Seller) => {
      await clientApp.seller({ id: row.seller_id }).delete();
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