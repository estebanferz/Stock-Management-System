import { useCallback } from "react";
import TableWrapper from "@/components/TableWrapper";
import { clientApp } from "@/lib/clientAPI";
import type { Phone } from "@server/db/schema";
import type { Column } from "../CustomTable";

interface PhoneTableManagerProps {
    data: Phone[];
    columns: Column<Phone>[];
}

export function PhoneTableManager({ data, columns }: PhoneTableManagerProps) {

  const handleEdit = useCallback((row: Phone) => {
      const ev = new CustomEvent("open-edit-phone", { detail: row });
      window.dispatchEvent(ev);
  }, []);

  const handleDelete = useCallback(async (row: Phone) => {
      await clientApp.phone({ id: row.device_id }).delete();
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