import type { Column } from "@/components/CustomTable"
import type { Client } from "@server/db/schema"

export const clientColumns: Column<Client>[] = [

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
    accessorKey: "id_number", 
    header: "DNI" 
  },
  { 
    accessorKey: "debt", 
    header: "Deuda",
    renderKey: "money"
  },
]
