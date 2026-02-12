import { db } from "@server/db/db";
import { expenseTable, providerTable } from "@server/db/schema.ts";
import { ilike, and, eq, sql, gte, lte } from "drizzle-orm";
import { isCurrency, normalizeShortString, round2 } from "../util/formattersBackend";
import type { Currency } from "@server/db/types";
import { convert } from "./currencyService";
import { presignPut, presignGet } from "../lib/s3";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf", "image/webp"] as const;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function isAllowedType(v: string): v is (typeof ALLOWED_TYPES)[number] {
  return (ALLOWED_TYPES as readonly string[]).includes(v);
}

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

async function assertProviderBelongsToTenant(tenantId: number, providerId: number) {
  const [p] = await db
    .select({ provider_id: providerTable.provider_id })
    .from(providerTable)
    .where(and(eq(providerTable.provider_id, providerId), eq(providerTable.tenant_id, tenantId)))
    .limit(1);

  if (!p) throw new Error("PROVIDER_NOT_FOUND");
}

function makeReceiptKey(tenantId: number, expenseId: number, filename: string) {
  const ext = (filename.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const ts = Date.now();
  const rand = crypto.randomUUID();
  return `tenants/${tenantId}/expenses/${expenseId}/${ts}-${rand}.${ext}`;
}

/** --------------------------
 *  CRUD Expenses (sin archivo)
 *  -------------------------- */

export const getAllExpenses = async (tenantId: number) => {
  return await db
    .select()
    .from(expenseTable)
    .where(eq(expenseTable.tenant_id, tenantId))
    .orderBy(expenseTable.expense_id);
};

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

export const addExpense = async (
  tenantId: number,
  actorUserId: number,
  newExpense: {
    datetime?: Date;
    category: string;
    description?: string | null;
    amount: string;
    currency: string;
    payment_method: string;
    provider_id?: number | null;
    is_deleted?: boolean;
  }
) => {
  const provider_id = normalizeProviderId((newExpense as any).provider_id);
  if (provider_id !== null) {
    await assertProviderBelongsToTenant(tenantId, provider_id);
  }

  
  
  const normalizedExpense = {
    ...newExpense,
    provider_id,
    tenant_id: tenantId,
    created_by_user_id: actorUserId,
    category: normalizeShortString(newExpense.category),
    payment_method: normalizeShortString(newExpense.payment_method),
    description: newExpense.description?.trim() ?? undefined,
  };
  
  console.log("datetime typeof:", typeof (normalizedExpense as any).datetime, normalizedExpense.datetime);
  return await db.insert(expenseTable).values(normalizedExpense).returning();
};

export const updateExpense = async (
  tenantId: number,
  expense_id: number,
  expense_upd: {
    category?: string;
    description?: string | null;
    amount?: string;
    currency?: string;
    payment_method?: string;
    provider_id?: string | number | null;
    datetime?: Date;
  }
) => {
  const provider_id = normalizeProviderId(expense_upd.provider_id);

  if (provider_id) {
    await assertProviderBelongsToTenant(tenantId, provider_id);
  }

  const updateData: Record<string, any> = {
    datetime: expense_upd.datetime,
    category: expense_upd.category ? normalizeShortString(expense_upd.category) : undefined,
    description:
      expense_upd.description !== undefined ? (expense_upd.description?.trim() ?? null) : undefined,
    amount: expense_upd.amount,
    currency: expense_upd.currency,
    payment_method: expense_upd.payment_method
      ? normalizeShortString(expense_upd.payment_method)
      : undefined,
    provider_id,
  };

  return await db
    .update(expenseTable)
    .set(updateData)
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

/** -----------------------------------------
 *  Bucket receipts: presign PUT + link + GET
 *  ----------------------------------------- */

export async function presignExpenseReceiptUpload(
  tenantId: number,
  expenseId: number,
  input: { contentType: string; filename: string; size: number }
): Promise<
  { ok: true; key: string; putUrl: string } | { ok: false; status: number; message: string }
> {
  if (!isAllowedType(input.contentType)) {
    return { ok: false, status: 400, message: "INVALID_RECEIPT_TYPE" };
  }
  if (input.size > MAX_SIZE) {
    return { ok: false, status: 400, message: "RECEIPT_TOO_LARGE" };
  }

  const [exp] = await db
    .select({ expense_id: expenseTable.expense_id })
    .from(expenseTable)
    .where(and(eq(expenseTable.expense_id, expenseId), eq(expenseTable.tenant_id, tenantId)))
    .limit(1);

  if (!exp) return { ok: false, status: 404, message: "EXPENSE_NOT_FOUND" };

  const key = makeReceiptKey(tenantId, expenseId, input.filename);
  const putUrl = await presignPut({ key, contentType: input.contentType, expiresInSec: 60 * 5 });

  return { ok: true, key, putUrl };
}

export async function linkExpenseReceipt(
  tenantId: number,
  expenseId: number,
  input: { key: string; contentType: string; filename: string; size: number }
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  if (!isAllowedType(input.contentType)) {
    return { ok: false, status: 400, message: "INVALID_RECEIPT_TYPE" };
  }
  if (input.size > MAX_SIZE) {
    return { ok: false, status: 400, message: "RECEIPT_TOO_LARGE" };
  }

  const updated = await db
    .update(expenseTable)
    .set({
      receipt_key: input.key,
      receipt_mime: input.contentType,
      receipt_original_name: input.filename,
      receipt_size: input.size,
      receipt_uploaded_at: new Date(),
    })
    .where(and(eq(expenseTable.expense_id, expenseId), eq(expenseTable.tenant_id, tenantId)))
    .returning({ expense_id: expenseTable.expense_id });

  if (!updated.length) return { ok: false, status: 404, message: "EXPENSE_NOT_FOUND" };
  return { ok: true };
}

export async function getExpenseReceiptSignedUrl(tenantId: number, expenseId: number) {
  const [expense] = await db
    .select({
      receipt_key: expenseTable.receipt_key,
      receipt_original_name: expenseTable.receipt_original_name,
      receipt_mime: expenseTable.receipt_mime,
    })
    .from(expenseTable)
    .where(and(eq(expenseTable.expense_id, expenseId), eq(expenseTable.tenant_id, tenantId)))
    .limit(1);

  if (!expense?.receipt_key) return null;

  const filename = expense.receipt_original_name ?? "comprobante";
  const disposition = `inline; filename="${filename.replace(/"/g, "")}"`;

  return presignGet({
    key: expense.receipt_key,
    expiresInSec: 60 * 10,
    responseContentDisposition: disposition,
  });
}
