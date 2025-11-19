import type { Column } from "@/components/CustomTable"
import type { Sale } from "@server/db/schema"

export const saleColumns: Column<Sale>[] = [
  { accessorKey: "sale_id", header: "ID" },

  {
    accessorKey: "datetime",
    header: "Fecha",
    renderKey: "date",
  },
  
  { accessorKey: "client_id", header: "Cliente" },
  { accessorKey: "seller_id", header: "Vendedor" },
  { accessorKey: "device_id", header: "Disp." },

  {
    accessorKey: "total_amount",
    header: "Total",
    renderKey: "money",
  },

  { 
    accessorKey: "payment_method", 
    header: "Método",
    renderKey: "paymentMethod",
  },

  {
    accessorKey: "debt",
    header: "¿Deuda?",
    renderKey: "yesno",
  },

  {
    accessorKey: "debt_amount",
    header: "Monto adeudado",
    renderKey: "money",
  },
]
