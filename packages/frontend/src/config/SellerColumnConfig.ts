import type { Column } from "@/components/CustomTable"
import type { Seller } from "@server/db/schema"

export const sellerColumns: Column<Seller>[] = [
  { accessorKey: "seller_id", header: "ID" },

  
  { accessorKey: "name", header: "Nombre" },
  { accessorKey: "age", header: "Edad" },
  { accessorKey: "email", header: "Email" },
  
  {
      accessorKey: "phone_number",
      header: "Teléfono",
    },
    
    {
      accessorKey: "hire_date",
      header: "Fecha",
      renderKey: "date",
    },
      {
      accessorKey: "pay_date",
      header: "Fecha",
      renderKey: "date",
    },
]
