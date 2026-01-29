import { parsePhoneNumberFromString } from "libphonenumber-js";


export const formatDate = (value: string | Date) => {
  if (!value) return "";

  const iso =
    value instanceof Date
      ? value.toISOString().slice(0, 10)
      : value.slice(0, 10);

  const [year, month, day] = iso.split("-");

  return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year.slice(2)}`;
};


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

export const generalStringFormat = (v: string) => {
  if (!v) return "";
  const parts = v.split("-");

  const formattedParts = parts.map((p) => {
    if (!p) return "";
    let word = p.charAt(0).toUpperCase() + p.slice(1);

    if (word === "Iphone") {
      word = "iPhone";
    }

    return word;
  });

  return formattedParts.join(" ");
};


export const SalesDataByMonth = (SalesData: any[]) => {
  
  return SalesData.map((sale) => {
    const dateObject = new Date(sale.month_start_date);

    const monthIndex = dateObject.getUTCMonth(); // 👈 CLAVE
    const months = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];

    const monthName = months[monthIndex];


    const newSaleObject = {
      ...sale, // Copia todas las propiedades existentes
      month: monthName, // Añade la nueva propiedad 'month'
    };

    return newSaleObject;
  });
}

export const formatPhoneE164 = (raw: string) => {
  if (!raw) return "";

  const phone = parsePhoneNumberFromString(raw);

  if (!phone || !phone.isValid()) return raw;

  let national: string = String(phone.nationalNumber);

  if (national.startsWith("9") && national.length >= 10) {
    national = national.slice(1);
  }

  const areaCodeLength = national.length === 10 ? 3 : 4;
  const area = national.slice(0, areaCodeLength);
  const local = national.slice(areaCodeLength);

  return `+${phone.countryCallingCode} ${area} ${local}`;
};

export const toInputDate = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  if (typeof value === "string") {
    return value.split("T")[0];
  }

  return "";
};

export function normalizeShortString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");   
}

export function translateType(str: string): string {
  if (str == "technician") return "técnico"
  if (str == "device") return "dispoitivo"
  if (str == "client") return "cliente"
  if (str == "seller") return "vendedor"

  return ""
}