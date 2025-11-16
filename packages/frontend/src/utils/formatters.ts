// src/utils/formatters.ts

export const formatDate = (value: string | Date) => {
  const d = value instanceof Date ? value : new Date(value)
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
}

export const formatMoney = (v: string | number) =>
  `$${Number(v).toLocaleString("es-AR")}`


export const formatPaymentMethod = (v: string) => {

  if (!v) return ""

  const parts = v.split("-")

  if (parts.length === 1) {
    return `${parts[0].charAt(0).toUpperCase() + parts[0].slice(1)}`
  }

  let first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)

  if (first == "Transferencia"){
    first = "Transfer."
  }
  const second = parts[1].toUpperCase()

  return `${first} ${second}`
}
