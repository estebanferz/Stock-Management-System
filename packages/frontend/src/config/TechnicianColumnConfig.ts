import type { Column } from "@/components/CustomTable"
import type { Technician } from "@server/db/schema"

export const technicianColumns: Column<Technician>[] = [
    {
        accessorKey: "name",
        header: "Nombre",
        renderKey: "general"
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
        accessorKey: "speciality", 
        header: "Especialidad",
        renderKey: "description"
    },
    { 
        accessorKey: "state", 
        header: "Estado",
    }

]
