import type { Column } from "@/components/CustomTable"
import type { Phone } from "@server/db/schema"

export const phoneColumns: Column<Phone>[] = [
    {
        accessorKey: "device_id",
        header: "ID",
    },
    {
        accessorKey: "brand",
        header: "Marca",
        renderKey: "general"
    },
    {
        accessorKey: "name",
        header: "Modelo",
        renderKey: "general",
    },
    {
        accessorKey: "price",
        header: "Precio",
        renderKey: "money",
    },
    {
        accessorKey: "imei",
        header: "IMEI",
    },
    {
        accessorKey: "device_type",
        header: "Tipo",
        renderKey: "general"
    },
    {
        accessorKey: "battery_health",
        header: "% Bat.",
    },
       {
        accessorKey: "storage_capacity",
        header: "Almacenamiento",
    },
    {
        accessorKey: "color",
        header: "Color",
        renderKey: "general"
    },{
        accessorKey: "category",
        header: "Categoría",
        renderKey: "general"
    },
       {
        accessorKey: "buy_cost",
        header: "Costo",
        renderKey: "money",
    },
    {
        accessorKey: "deposit",
        header: "Depósito",
    },
       {
        accessorKey: "sold",
        header: "Vendido",
    },

]