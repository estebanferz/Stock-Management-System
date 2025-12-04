import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

import { formatDate, formatMoney, formatPaymentMethod, generalStringFormat, formatPhoneE164 } from "@/utils/formatters"
import { TruncatedDescription } from "./TruncatedDescription"

export interface Column<T> {
  key?: keyof T
  accessorKey?: string
  header: string
  render?: (value: any, row: T) => React.ReactNode
  renderKey?: string
}

interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
}

export function CustomTable<T>({ data, columns }: TableProps<T>) {

  const RENDERERS: Record<string, (v: any, r: T) => React.ReactNode> = {
    date: (v) => formatDate(v),
    money: (v) => formatMoney(v),
    yesno: (v) => (v ? "Sí" : "No"),
    paymentMethod: (v) => formatPaymentMethod(v),
    general: (v) => generalStringFormat(v),
    phone: (v) => formatPhoneE164(v),
    description: (v) => <TruncatedDescription text={v}/>,
  }

  const getRenderer = (col: Column<T>) => {
    if (col.render && typeof col.render === "function") return col.render

    if (col.renderKey && RENDERERS[col.renderKey]) {
      return RENDERERS[col.renderKey]
    }

    return null
  }

  const getColKey = (col: Column<T>) =>
    (col.accessorKey as string) || (col.key as string)

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    Object.fromEntries(columns.map((col) => [getColKey(col), true]))
  )

  const toggleColumn = (key: string) =>
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }))

  const allSelected = Object.values(visibleColumns).every(Boolean)

  const toggleAll = (value: boolean) =>
    setVisibleColumns(
      Object.fromEntries(columns.map((col) => [getColKey(col), value]))
    )

  return (
    <div className="w-full text-center">
      {/* Dropdown button (column toggle) */}
      <div className="flex justify-end p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto shadow-lg">
              Columnas <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={allSelected}
              onCheckedChange={(checked) => toggleAll(!!checked)}
              className="font-semibold text-gray-800"
            >
              Seleccionar todos
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />

            {columns.map((col) => {
              const colKey = getColKey(col)
              return (
                <DropdownMenuCheckboxItem
                  key={colKey}
                  checked={visibleColumns[colKey]}
                  onCheckedChange={() => toggleColumn(colKey)}
                  className="capitalize"
                >
                  {col.header}
                </DropdownMenuCheckboxItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="max-h-96 overflow-auto shadow-lg border rounded-lg">
        <table className="min-w-full table-auto">
          <thead>
            <tr>
              {columns
                .filter((col) => visibleColumns[getColKey(col)])
                .map((col) => (
                  <th
                    key={getColKey(col)}
                    className="sticky top-0 z-10 bg-gray-100 px-4 py-2 font-semibold text-gray-700 border-b"
                  >
                    {col.header}
                  </th>
                ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, i) => (
              <tr
                key={(row as any).id ?? i}
                className="bg-white hover:bg-gray-50 border-b"
              >
                {columns
                  .filter((col) => visibleColumns[getColKey(col)])
                  .map((col) => {
                    const colKey = getColKey(col)
                    const value = (row as any)[colKey]

                    const renderer = getRenderer(col)

                    return (
                      <td key={colKey} className="px-4 py-3 text-sm text-gray-600">
                        {renderer ? renderer(value, row) : String(value ?? "")}
                      </td>
                    )
                  })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
