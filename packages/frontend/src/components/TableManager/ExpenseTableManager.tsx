import { useCallback } from "react";
import TableWrapper from "@/components/TableWrapper";
import { clientApp } from "@/lib/clientAPI";
import type { Expense } from "@server/db/schema";
import type { Column } from "../CustomTable";

interface ExpenseTableManagerProps {
    data: Expense[];
    columns: Column<Expense>[];
}

export function ExpenseTableManager({ data, columns }: ExpenseTableManagerProps) {

  const handleEdit = useCallback((row: Expense) => {
      const ev = new CustomEvent("open-edit-expense", { detail: row });
      window.dispatchEvent(ev);
  }, []);

  const handleDelete = useCallback(async (row: Expense) => {
      await clientApp.expense({ id: row.expense_id }).delete();
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