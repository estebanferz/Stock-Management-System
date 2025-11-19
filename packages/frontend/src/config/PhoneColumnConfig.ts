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
    },
    {
        accessorKey: "name",
        header: "Modelo",
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
    },{
        accessorKey: "category",
        header: "Categoría",
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