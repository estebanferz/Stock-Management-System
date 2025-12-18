import { and, ilike, sql } from "drizzle-orm";

export function normalizeShortString(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");   
}

export function dateToYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function safeFilename(name: string) {
  return name
    // normaliza unicode
    .normalize("NFKD")
    // elimina caracteres no ASCII
    .replace(/[^\x20-\x7E]/g, "")
    // reemplaza espacios múltiples
    .replace(/\s+/g, "_")
    // fallback
    .slice(0, 150) || "comprobante";
}


export function ilikeWordsNormalized(column: any, value?: string) {
  if (!value) return undefined;

  // normalizamos el input: "Juana Go" -> ["juana", "go"]
  const words = value
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  // normalizamos el column: "juana-gorriti" -> "juana gorriti"
  const normalizedCol = sql`regexp_replace(lower(${column}), '[-_]+', ' ', 'g')`;

  return and(...words.map((w) => ilike(normalizedCol as any, `%${w}%`)));
}