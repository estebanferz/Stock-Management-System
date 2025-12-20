import type { Column } from "@/components/CustomTable"
import type { Phone } from "@server/db/schema"

export const phoneColumns: Column<Phone>[] = [
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
        accessorKey: "buy_cost",
        header: "Costo",
        renderKey: "money",
    },
    {
        accessorKey: "imei",
        header: "IMEI",
    },
    {
        accessorKey: "battery_health",
        header: "%Bat.",
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
        accessorKey: "deposit",
        header: "Depósito",
        renderKey: "general",
    },
       {
        accessorKey: "sold",
        header: "Vendido",
    },

]