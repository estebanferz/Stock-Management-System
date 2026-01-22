import type { Column } from "@/components/CustomTable"
import type { Sale } from "@server/db/schema"

export const saleColumns: Column<Sale>[] = [
  {
    accessorKey: "datetime",
    header: "Fecha",
    renderKey: "date",
  },
  
  { accessorKey: "client_name", header: "Cliente", renderKey: "general" },
  { accessorKey: "seller_name", header: "Vendedor", renderKey: "general" },
  { accessorKey: "device_name", header: "Disp.", renderKey: "general" },

  {
    accessorKey: "total_amount",
    header: "Total",
    renderKey: "money",
  },
  {
    accessorKey: "currency",
    header: "Moneda",
  },  
  { 
    accessorKey: "payment_method", 
    header: "Método",
    renderKey: "paymentMethod",
  },

  {
    accessorKey: "debt_amount",
    header: "Deuda",
    renderKey: "money",
  },

]
