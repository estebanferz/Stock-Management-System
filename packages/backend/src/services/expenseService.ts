import { db } from "@server/db/db";
import { expenseTable, providerTable } from "@server/db/schema.ts";
import { ilike, and, eq, sql, gte, lte } from "drizzle-orm";
import { fmtMoney, isCurrency, normalizeShortString, round2 } from "../util/formattersBackend";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import fs from "node:fs";
import type { Currency } from "@server/db/types";
import { convert } from "./currencyService";

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

  const receipt_path = `expenses/${fileName}`;
  const absPath = path.join(UPLOADS_DIR, receipt_path);
  await Bun.write(absPath, receipt);

  return {
    receipt_path,
    receipt_original_name: receipt.name,
    receipt_mime: receipt.type,
    receipt_size: receipt.size,
  };
}

async function assertProviderBelongsToTenant(tenantId: number, providerId: number) {
  const [p] = await db
    .select({ provider_id: providerTable.provider_id })
    .from(providerTable)
    .where(and(eq(providerTable.provider_id, providerId), eq(providerTable.tenant_id, tenantId)))
    .limit(1);

  if (!p) throw new Error("PROVIDER_NOT_FOUND");
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

export async function addExpenseWithReceipt(
  tenantId: number,
  actorUserId: number,
  input: AddExpenseInput
) {
  const provider_id = normalizeProviderId(input.provider_id);

  if (provider_id) {
    await assertProviderBelongsToTenant(tenantId, provider_id);
  }

  const receiptData = input.receipt ? await saveReceipt(input.receipt) : undefined;

  return db
    .insert(expenseTable)
    .values({
      tenant_id: tenantId,
      created_by_user_id: actorUserId,
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
  tenantId: number,
  actorUserId: number,
  expenseId: number,
  body: {
    category?: string;
    description?: string | null;
    amount?: string;
    payment_method?: string;
    provider_id?: string | number | null;
    receipt?: File;
    datetime?: string;
  }
) {
  // Traer solo si pertenece al tenant
  const [current] = await db
    .select()
    .from(expenseTable)
    .where(and(eq(expenseTable.expense_id, expenseId), eq(expenseTable.tenant_id, tenantId)));

  if (!current) {
    throw new Error("EXPENSE_NOT_FOUND");
  }

  const provider_id = normalizeProviderId(body.provider_id);

  if (provider_id) {
    await assertProviderBelongsToTenant(tenantId, provider_id);
  }

  const updateData: Record<string, any> = {
    // (si querés permitir update de datetime)
    datetime: body.datetime ? new Date(body.datetime) : undefined,

    category: body.category ? normalizeShortString(body.category) : undefined,
    description: body.description !== undefined ? body.description?.trim() ?? null : undefined,
    amount: body.amount,
    payment_method: body.payment_method ? normalizeShortString(body.payment_method) : undefined,
    provider_id,
    // auditoría opcional: si querés guardar el último editor
    // updated_by_user_id: actorUserId,
  };

  if (body.receipt) {
    const receiptData = await saveReceipt(body.receipt);

    if (current.receipt_path) {
      try {
        await unlink(path.join(UPLOADS_DIR, current.receipt_path));
      } catch {
        // no crítico
      }
    }

    Object.assign(updateData, receiptData);
  }

  return db
    .update(expenseTable)
    .set(updateData)
    .where(and(eq(expenseTable.expense_id, expenseId), eq(expenseTable.tenant_id, tenantId)))
    .returning();
}

export async function getExpensesByFilter(
  tenantId: number,
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
  // opcional: si viene provider_id, validar que sea del tenant
  if (filters.provider_id) {
    const pid = Number(filters.provider_id);
    if (Number.isFinite(pid) && pid > 0) {
      await assertProviderBelongsToTenant(tenantId, pid);
    }
  }

  return await db
    .select()
    .from(expenseTable)
    .where(
      and(
        eq(expenseTable.tenant_id, tenantId),

        filters.date ? eq(sql`date(${expenseTable.datetime})`, filters.date) : undefined,

        filters.category ? ilike(expenseTable.category, `%${filters.category}%`) : undefined,

        filters.payment_method
          ? ilike(expenseTable.payment_method, `%${filters.payment_method}%`)
          : undefined,

        filters.provider_id ? eq(expenseTable.provider_id, Number(filters.provider_id)) : undefined,

        filters.amount_min ? gte(expenseTable.amount, filters.amount_min) : undefined,
        filters.amount_max ? lte(expenseTable.amount, filters.amount_max) : undefined,

        filters.is_deleted !== undefined
          ? eq(expenseTable.is_deleted, filters.is_deleted)
          : eq(expenseTable.is_deleted, false)
      )
    )
    .orderBy(sql`${expenseTable.datetime} DESC`);
}

export const getAllExpenses = async (tenantId: number) => {
  return await db
    .select()
    .from(expenseTable)
    .where(eq(expenseTable.tenant_id, tenantId))
    .orderBy(expenseTable.expense_id);
};

export const addExpense = async (
  tenantId: number,
  actorUserId: number,
  newExpense: {
    datetime?: Date;
    category: string;
    description?: string | null;
    amount: string;
    payment_method: string;
    provider_id?: number | null;
    receipt_path?: string;
    receipt_original_name?: string;
    receipt_mime?: string;
    receipt_size?: number;
    is_deleted?: boolean;
  }
) => {
  if (newExpense.provider_id) {
    await assertProviderBelongsToTenant(tenantId, newExpense.provider_id);
  }

  const normalizedExpense = {
    ...newExpense,
    tenant_id: tenantId,
    created_by_user_id: actorUserId,
    category: normalizeShortString(newExpense.category),
    payment_method: normalizeShortString(newExpense.payment_method),
    description: newExpense.description?.trim() ?? undefined,
  };

  return await db.insert(expenseTable).values(normalizedExpense).returning();
};

export const updateExpense = async (
  tenantId: number,
  expense_id: number,
  expense_upd: {
    category?: string;
    description?: string;
    amount?: string;
    payment_method?: string;
    provider_id?: number | null;
  }
) => {
  if (expense_upd.provider_id) {
    await assertProviderBelongsToTenant(tenantId, expense_upd.provider_id);
  }

  return await db
    .update(expenseTable)
    .set(expense_upd)
    .where(and(eq(expenseTable.expense_id, expense_id), eq(expenseTable.tenant_id, tenantId)))
    .returning();
};

export async function softDeleteExpense(tenantId: number, id: number) {
  const result = await db
    .update(expenseTable)
    .set({ is_deleted: true })
    .where(and(eq(expenseTable.expense_id, id), eq(expenseTable.tenant_id, tenantId)))
    .returning();

  return result.length > 0;
}

export const getTotalExpenses = async (tenantId: number) => {
  const result = await db
    .select({
      total_expenses: sql`SUM(${expenseTable.amount})`,
    })
    .from(expenseTable)
    .where(and(eq(expenseTable.tenant_id, tenantId), eq(expenseTable.is_deleted, false)));

  const { total_expenses } = result[0] ?? { total_expenses: 0 };
  return Number(total_expenses ?? 0);
};

type ExpenseCategoryRow = {
  category: string;
  total: number;
};

export const getTopExpensesByCategory = async (
  tenantId: number,
  display: Currency,
  fx: any,
  limit = 5
) => {
  const since = new Date();
  since.setMonth(since.getMonth() - 6);

  const rows = await db
    .select({
      category: expenseTable.category,
      amount: sql<number>`COALESCE(${expenseTable.amount}, 0)`,
      currency: expenseTable.currency,
      datetime: expenseTable.datetime,
    })
    .from(expenseTable)
    .where(
      and(
        eq(expenseTable.tenant_id, tenantId),
        eq(expenseTable.is_deleted, false),
        gte(expenseTable.datetime, since)
      )
    );

  const totals = new Map<string, number>();

  for (const r of rows) {
    const category = String(r.category ?? "Sin categoría");
    const amt = Number(r.amount ?? 0);
    if (!Number.isFinite(amt) || amt === 0) continue;
    const cur: Currency = isCurrency(r.currency) ? r.currency : "ARS";
    const converted = convert(amt, cur, display, fx.ratesToARS);
    totals.set(category, (totals.get(category) ?? 0) + converted);
  }

  const result: ExpenseCategoryRow[] = [...totals.entries()]
    .map(([category, total]) => ({ category, total: round2(total) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  return result;
};


export async function getExpenseReceiptFile(tenantId: number, expenseId: number) {
  const [expense] = await db
    .select({
      receipt_path: expenseTable.receipt_path,
      receipt_original_name: expenseTable.receipt_original_name,
      receipt_mime: expenseTable.receipt_mime,
    })
    .from(expenseTable)
    .where(and(eq(expenseTable.expense_id, expenseId), eq(expenseTable.tenant_id, tenantId)));

  if (!expense || !expense.receipt_path) return null;

  const absPath = path.join(UPLOADS_DIR, expense.receipt_path);
  if (!fs.existsSync(absPath)) return null;

  return {
    file: Bun.file(absPath),
    mime: expense.receipt_mime ?? "application/octet-stream",
    originalName: expense.receipt_original_name ?? "comprobante",
  };
}
