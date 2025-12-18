import type { Column } from "@/components/CustomTable";
import type { Repair } from "@server/db/schema";

export const repairColumns: Column<Repair>[] = [
    {
        accessorKey: "datetime",
        header: "Fecha",
        renderKey: "date",
    },
    {
        accessorKey: "client_name",
        header: "Cliente",
        renderKey: "general"
    },
    {
        accessorKey: "technician_name",
        header: "Técnico",
        renderKey: "general"
    },
    {
        accessorKey: "device_name",
        header: "Dispositivo",
        renderKey: "general"
    },
    {
        accessorKey: "repair_state",
        header: "Estado",
        renderKey: "general"
    },
    {
        accessorKey: "priority",
        header: "Prioridad",
        renderKey: "general"
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