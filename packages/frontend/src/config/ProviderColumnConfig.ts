import type { Column } from "@/components/CustomTable"
import type { Provider } from "@server/db/schema"

export const providerColumns: Column<Provider>[] = [
  {
    accessorKey: "name",
    header: "Nombre",
  },
  
  { 
    accessorKey: "email",
    header: "Email"
    },
  { 
    accessorKey: "phone_number", 
    header: "Teléfono",
    renderKey: "phone"
  },
  { 
    accessorKey: "address", 
    header: "Dirección",
    renderKey: "general",
  },
]
