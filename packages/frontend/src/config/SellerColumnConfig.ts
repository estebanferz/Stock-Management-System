import type { Column } from "@/components/CustomTable"
import type { Seller } from "@server/db/schema"

export const sellerColumns: Column<Seller>[] = [
  { accessorKey: "name", header: "Nombre", renderKey: "general" },
  { accessorKey: "age", header: "Edad" },
  { accessorKey: "email", header: "Email" },
  
  {
    accessorKey: "phone_number",
    header: "Teléfono",
    renderKey: "phone"

  },
  {
    accessorKey: "commission",
    header: "Comisión (%)",
  },
  
  {
    accessorKey: "hire_date",
    header: "Contratación",
    renderKey: "date",
  },
  {
    accessorKey: "pay_date",
    header: "Fecha Pago",
    renderKey: "date",
  },
]
