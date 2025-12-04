import type { Column } from "@/components/CustomTable";
import type { Repair } from "@server/db/schema";

export const repairColumns: Column<Repair>[] = [
    {
        accessorKey: "repair_id",
        header: "ID",
    },
    {
        accessorKey: "datetime",
        header: "Fecha",
        renderKey: "date",
    },
    {
        accessorKey: "client_id",
        header: "Cliente",
    },
    {
        accessorKey: "technician_id",
        header: "Técnico",
    },
    {
        accessorKey: "device_id",
        header: "Dispositivo",
    },
    {
        accessorKey: "repair_state",
        header: "Estado",
        renderKey: "general"
    },
    {
        accessorKey: "priority",
        header: "Prioridad",
    },
    {
        accessorKey: "description",
        header: "Descripcion",
        renderKey: "description"
    },
    {
        accessorKey: "diagnostic",
        header: "Diagnóstico",
        renderKey: "description"
    },
    {
        accessorKey: "client_cost",
        header: "Costo Cliente",
        renderKey: "money",
    },
    {
        accessorKey: "internal_cost",
        header: "Costo Interno",
        renderKey: "money",
    },

]