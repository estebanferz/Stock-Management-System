import React, { useState } from "react"
import { formatDate, formatMoney, formatPaymentMethod, generalStringFormat, formatPhoneE164 } from "@/utils/formatters"
import { TruncatedDescription } from "./TruncatedDescription"
import { ReceiptCell } from "./ReceiptCell"
import { PreviewModal } from "./PreviewModal"

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
  visibleColumns?: Record<string, boolean>
  onVisibleColumnsChange?: (next: Record<string, boolean>) => void 
  isActionMode: boolean
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
}

export function CustomTable<T>({
  data,
  columns,
  visibleColumns: visibleColumnsExternal,
  onVisibleColumnsChange,
  isActionMode = false,
  onEdit,
  onDelete
}: TableProps<T>) {

  const [pdfPreview, setPdfPreview] = useState<{
    open: boolean;
    fileName?: string;
    filePath?: string;
  }>({
    open: false,
  });

  const getColKey = (col: Column<T>) =>
    (col.accessorKey as string) || (col.key as string)

  const [visibleColumnsInternal, setVisibleColumnsInternal] = useState<Record<string, boolean>>(
    Object.fromEntries(columns.map((col) => [getColKey(col), true]))
  )

  const visibleColumns = visibleColumnsExternal ?? visibleColumnsInternal

  const setVisibleColumns = (next: Record<string, boolean>) => {
    if (onVisibleColumnsChange) onVisibleColumnsChange(next)
    else setVisibleColumnsInternal(next)
  }

  const RENDERERS: Record<string, (v: any, r: T) => React.ReactNode> = {
    date: (v) => formatDate(v),
    money: (v) => formatMoney(v),
    yesno: (v) => (v ? "Sí" : "No"),
    paymentMethod: (v) => formatPaymentMethod(v),
    general: (v) => generalStringFormat(v),
    phone: (v) => formatPhoneE164(v),
    description: (v) => <TruncatedDescription text={v}/>,
    receipt: (_v, row) => (
      <ReceiptCell
        fileName={(row as any).receipt_original_name}
        expenseId={(row as any).expense_id} 
        mime={(row as any).receipt_mime}
      />
    ),
  }

  const getRenderer = (col: Column<T>) => {
    if (col.render && typeof col.render === "function") return col.render
    if (col.renderKey && RENDERERS[col.renderKey]) return RENDERERS[col.renderKey]
    return null
  }

  return (
    <div className="w-full text-center">

      {/* ❌ Se quita el DropdownMenu de columnas (ahora está en ActionPanel) */}

      {/* Tabla */}

      <div className="max-h-96 overflow-auto shadow-lg border rounded-lg relative">
        {/* tabla: ocupa TODO el ancho del contenedor */}
        <table className="w-full table-auto">
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

              {isActionMode && (
              <th
                className="
                  sticky top-0 right-0
                  z-30
                  bg-gray-200
                  px-2
                  shadow-[inset_10px_0_10px_-10px_rgba(0,0,0,0.25)]
                "
              >
                Acción
              </th>
              )}
            </tr>
          </thead>

          <tbody>
            {data.map((row, i) => (
              <tr
                key={(row as any).id ?? i}
                className="bg-white hover:bg-gray-50 border-b align-middle"
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

                {/* td Acción: sticky, derecha, con z mayor que las celdas normales */}
                {isActionMode && (
                <td
                  className="
                    sticky right-0
                    z-20
                    bg-white
                    shadow-[inset_10px_0_10px_-10px_rgba(0,0,0,0.15)]
                  "
                >
                    <div className="flex gap-2 justify-center items-center">
                      {onEdit && (
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-blue-100 text-blue-600 hover:text-blue-800"
                          onClick={() => onEdit(row)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24" width="20" height="20">
                            <path d="M22.94,1.061c-1.368-1.367-3.76-1.365-5.124,0L1.611,17.265c-1.039,1.04-1.611,2.421-1.611,3.89v2.346c0,.276,.224,.5,.5,.5H2.846c1.47,0,2.851-.572,3.889-1.611L22.86,6.265c.579-.581,.953-1.262,1.08-1.972,.216-1.202-.148-2.381-1-3.232ZM6.028,21.682c-.85,.851-1.979,1.318-3.182,1.318H1v-1.846c0-1.202,.468-2.332,1.318-3.183L15.292,4.999l3.709,3.709L6.028,21.682ZM22.956,4.116c-.115,.642-.5,1.138-.803,1.441l-2.444,2.444-3.709-3.709,2.525-2.525c.986-.988,2.718-.99,3.709,0,.617,.617,.88,1.473,.723,2.349Z"/>
                          </svg>
                        </button>
                      )}

                      {onDelete && (
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-100 text-red-600 hover:text-red-800"
                          onClick={() => onDelete(row)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24" width="20" height="20">
                            <path d="M21.5,4h-3.551c-.252-2.244-2.139-4-4.449-4h-3c-2.31,0-4.197,1.756-4.449,4H2.5c-.276,0-.5,.224-.5,.5s.224,.5,.5,.5h1.5v14.5c0,2.481,2.019,4.5,4.5,4.5h7c2.481,0,4.5-2.019,4.5-4.5V5h1.5c.276,0,.5-.224,.5-.5s-.224-.5-.5-.5ZM10.5,1h3c1.758,0,3.204,1.308,3.449,3H7.051c.245-1.692,1.691-3,3.449-3Zm8.5,18.5c0,1.93-1.57,3.5-3.5,3.5h-7c-1.93,0-3.5-1.57-3.5-3.5V5h14v14.5ZM10,10.5v7c0,.276-.224,.5-.5,.5s-.5-.224-.5-.5v-7c0-.276,.224-.5,.5-.5s.5,.224,.5,.5Zm5,0v7c0,.276-.224,.5-.5,.5s-.5-.224-.5-.5v-7c0-.276,.224-.5,.5-.5s.5,.224,.5,.5Z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                )}

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
