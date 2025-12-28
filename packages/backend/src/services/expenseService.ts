import { db } from "@server/db/db";
import { expenseTable } from "@server/db/schema.ts";
import { ilike, and, eq, sql, gte, lte } from "drizzle-orm";
import { normalizeShortString } from "../util/formattersBackend";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import fs from "node:fs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;
const MAX_SIZE = 5 * 1024 * 1024;

function normalizeProviderId(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;

  if (typeof raw === "string") {
    const v = raw.trim();
    if (v === "" || v === "0" || v.toLowerCase() === "null") return null;
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
  }

  if (typeof raw === "number") {
    return Number.isInteger(raw) && raw > 0 ? raw : null;
  }

  return null;
}

const UPLOADS_DIR = path.join(import.meta.dir, "../../uploads");

async function saveReceipt(receipt: File) {
  if (!ALLOWED_TYPES.includes(receipt.type as any)) throw new Error("INVALID_RECEIPT_TYPE");
  if (receipt.size > MAX_SIZE) throw new Error("RECEIPT_TOO_LARGE");

  await mkdir(path.join(UPLOADS_DIR, "expenses"), { recursive: true });

  const ext = receipt.name.split(".").pop() ?? "bin";
  const fileName = `expense_${crypto.randomUUID()}.${ext}`;

  // ✅ DB guarda relativo a uploads/
  const receipt_path = `expenses/${fileName}`;

  // ✅ disco escribe absoluto
  const absPath = path.join(UPLOADS_DIR, receipt_path);
  await Bun.write(absPath, receipt);

  return {
    receipt_path,
    receipt_original_name: receipt.name,
    receipt_mime: receipt.type,
    receipt_size: receipt.size,
  };
}

type AddExpenseInput = {
  datetime?: string;
  category: string;
  description?: string | null;
  amount: string;
  payment_method: string;
  provider_id?: string | number | null;
  receipt?: File;
};

export async function addExpenseWithReceipt(userId: number, input: AddExpenseInput) {
  const provider_id = normalizeProviderId(input.provider_id);

  const receiptData = input.receipt ? await saveReceipt(input.receipt) : undefined;

  return db
    .insert(expenseTable)
    .values({
      user_id: userId, // ✅ multi-tenant
      datetime: input.datetime ? new Date(input.datetime) : undefined,
      category: normalizeShortString(input.category),
      description: input.description?.trim() ?? null,
      amount: input.amount,
      payment_method: normalizeShortString(input.payment_method),
      provider_id,
      ...receiptData,
    })
    .returning();
}

export async function updateExpenseWithReceipt(
  userId: number,
  expenseId: number,
  body: {
    category?: string;
    description?: string | null;
    amount?: string;
    payment_method?: string;
    provider_id?: string | number | null;
    receipt?: File;
  }
) {
  // ✅ Traer solo si pertenece al usuario
  const [current] = await db
    .select()
    .from(expenseTable)
    .where(and(eq(expenseTable.expense_id, expenseId), eq(expenseTable.user_id, userId)));

  if (!current) {
    throw new Error("EXPENSE_NOT_FOUND");
  }

  const provider_id = normalizeProviderId(body.provider_id);

  const updateData: Record<string, any> = {
    category: body.category ? normalizeShortString(body.category) : undefined,
    description:
      body.description !== undefined ? body.description?.trim() ?? null : undefined,
    amount: body.amount,
    payment_method: body.payment_method ? normalizeShortString(body.payment_method) : undefined,
    provider_id,
  };

  // Si viene nuevo comprobante
  if (body.receipt) {
    const receiptData = await saveReceipt(body.receipt);

    // borrar comprobante anterior (si existía)
    if (current.receipt_path) {
      try {
        await unlink(path.join(UPLOADS_DIR, current.receipt_path));
      } catch {
        // no es crítico
      }
    }

    Object.assign(updateData, receiptData);
  }

  // Update DB (scoped)
  return db
    .update(expenseTable)
    .set(updateData)
    .where(and(eq(expenseTable.expense_id, expenseId), eq(expenseTable.user_id, userId)))
    .returning();
}

export async function getExpensesByFilter(
  userId: number,
  filters: {
    date?: string;
    category?: string;
    payment_method?: string;
    provider_id?: string;
    amount_min?: string;
    amount_max?: string;
    is_deleted?: boolean;
  }
) {
  return await db
    .select()
    .from(expenseTable)
    .where(
      and(
        eq(expenseTable.user_id, userId), // ✅ multi-tenant siempre

        filters.date
          ? eq(sql`date(${expenseTable.datetime})`, filters.date)
          : undefined,

        filters.category
          ? ilike(expenseTable.category, `%${filters.category}%`)
          : undefined,

        filters.payment_method
          ? ilike(expenseTable.payment_method, `%${filters.payment_method}%`)
          : undefined,

        filters.provider_id
          ? eq(expenseTable.provider_id, Number(filters.provider_id))
          : undefined,

        filters.amount_min ? gte(expenseTable.amount, filters.amount_min) : undefined,
        filters.amount_max ? lte(expenseTable.amount, filters.amount_max) : undefined,

        filters.is_deleted !== undefined
          ? eq(expenseTable.is_deleted, filters.is_deleted)
          : eq(expenseTable.is_deleted, false)
      )
    )
    .orderBy(sql`${expenseTable.datetime} DESC`);
}

export const getAllExpenses = async (userId: number) => {
  return await db
    .select()
    .from(expenseTable)
    .where(eq(expenseTable.user_id, userId)) // ✅
    .orderBy(expenseTable.expense_id);
};

// --- Mantengo estas 2 por compat, pero las scopo por user para evitar agujeros ---

export const addExpense = async (
  userId: number,
  newExpense: {
    datetime?: Date;
    category: string;
    description?: string | null;
    amount: string;
    payment_method: string;
    receipt_number?: string;
    provider_id?: number | null;
    receipt_path?: string;
    receipt_original_name?: string;
    receipt_mime?: string;
    receipt_size?: number;
    is_deleted?: boolean;
  }
) => {
  const normalizedExpense = {
    ...newExpense,
    user_id: userId, // ✅
    category: normalizeShortString(newExpense.category),
    payment_method: normalizeShortString(newExpense.payment_method),
    description: newExpense.description?.trim() ?? undefined,
  };

  return await db.insert(expenseTable).values(normalizedExpense).returning();
};

export const updateExpense = async (
  userId: number,
  expense_id: number,
  expense_upd: {
    category?: string;
    description?: string;
    amount?: string;
    payment_method?: string;
    receipt_number?: string;
    provider_id?: number | null;
  }
) => {
  return await db
    .update(expenseTable)
    .set(expense_upd)
    .where(and(eq(expenseTable.expense_id, expense_id), eq(expenseTable.user_id, userId))) // ✅
    .returning();
};

export async function softDeleteExpense(userId: number, id: number) {
  const result = await db
    .update(expenseTable)
    .set({ is_deleted: true })
    .where(and(eq(expenseTable.expense_id, id), eq(expenseTable.user_id, userId))) // ✅
    .returning();

  return result.length > 0;
}

export const getTotalExpenses = async (userId: number) => {
  const result = await db
    .select({
      total_expenses: sql`SUM(${expenseTable.amount})`,
    })
    .from(expenseTable)
    .where(and(eq(expenseTable.user_id, userId), eq(expenseTable.is_deleted, false))); // ✅

  const { total_expenses } = result[0] ?? { total_expenses: 0 };
  return Number(total_expenses ?? 0);
};

export async function getExpenseReceiptFile(userId: number, expenseId: number) {
  const [expense] = await db
    .select({
      receipt_path: expenseTable.receipt_path,
      receipt_original_name: expenseTable.receipt_original_name,
      receipt_mime: expenseTable.receipt_mime,
    })
    .from(expenseTable)
    .where(and(eq(expenseTable.expense_id, expenseId), eq(expenseTable.user_id, userId))); // ✅

  if (!expense || !expense.receipt_path) {
    return null;
  }

  const absPath = path.join(UPLOADS_DIR, expense.receipt_path);

  if (!fs.existsSync(absPath)) {
    return null;
  }

  return {
    file: Bun.file(absPath),
    mime: expense.receipt_mime ?? "application/octet-stream",
    originalName: expense.receipt_original_name ?? "comprobante",
  };
}
