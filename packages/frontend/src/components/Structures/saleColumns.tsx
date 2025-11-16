import { type Column } from "@/components/CustomTable"

export interface Sale {
  id: number
  client: string
  seller: string
  total: number
  date: string
  
}

export const saleColumns: Column<Sale>[] = [
  { key: "id", header: "ID" },
  { key: "client", header: "Cliente" },
  { key: "seller", header: "Vendedor" },
  {
    key: "total",
    header: "Total ($)",
    render: (value) => `$${Number(value).toFixed(2)}`
  },
  { key: "date", header: "Fecha" },
]
