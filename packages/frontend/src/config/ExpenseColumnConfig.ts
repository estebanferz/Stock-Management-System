import type { Column } from "@/components/CustomTable"
import type { Expense } from "@server/db/schema"

export const expenseColumns: Column<Expense>[] = [
    {
        accessorKey: "datetime",
        header: "Fecha",
        renderKey: "date",
    },
    {
        accessorKey: "category",
        header: "Categoría",
        renderKey: "general"
    },
    {
        accessorKey: "description",
        header: "Descripción",
    },
    {
        accessorKey: "amount",
        header: "Monto",
        renderKey: "money",
    },
    {
        accessorKey: "payment_method",
        header: "Pago",
        renderKey: "paymentMethod"
    },
    {
        accessorKey: "receipt_number",
        header: "Comprobante",
        renderKey: "receipt",
    },
    {
        accessorKey: "provider_name",
        header: "Proveedor",
        renderKey: "general"
    },
]