import type { Column } from "@/components/CustomTable"
import type { Client } from "@server/db/schema"

export const clientColumns: Column<Client>[] = [
  { accessorKey: "client_id", header: "ID" },

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
]
