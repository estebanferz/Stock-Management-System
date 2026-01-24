import type { Column } from "@/components/CustomTable"
import type { Accessory } from "@server/db/schema"

export const accessoryColumns: Column<Accessory>[] = [
    {
        accessorKey: "name",
        header: "Modelo",
        renderKey: "general",
    },
    {
        accessorKey: "brand",
        header: "Marca",
        renderKey: "general"
    },
    {
        accessorKey: "price",
        header: "Precio",
        renderKey: "money",
    },
    {
        accessorKey: "currency_sale",
        header: "Moneda Venta",
    },
    {
        accessorKey: "buy_cost",
        header: "Costo",
        renderKey: "money",
    },
    {
        accessorKey: "currency_buy",
        header: "Moneda Compra",
    },
    {
        accessorKey: "stock",
        header: "Stock",
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
        accessorKey: "gift",
        header: "Vendido",
        renderKey: "yesno",
    },

]
