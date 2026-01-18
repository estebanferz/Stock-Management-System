import { and, desc, eq, gte, ilike, sql } from "drizzle-orm";
import { db } from "@server/db/db";
import { accessoryTable } from "@server/db/schema";
import { normalizeShortString } from "../util/formattersBackend";

// Tipos “input” para crear/actualizar (sin accessory_id/is_deleted)
export type NewAccessoryInput = {
  tenant_id: number;
  datetime: Date;
  name: string;
  brand: string;
  stock?: number;
  color?: string | null;
  category: string;
  price: string; // numeric suele venir como string en drizzle
  buy_cost: string;
  deposit: string;
  gift?: boolean;
};

export type UpdateAccessoryInput = {
  datetime: Date;
  name: string;
  brand: string;
  stock: number;
  color?: string | null;
  category: string;
  price: string;
  buy_cost: string;
  deposit: string;
  gift: boolean;
};

export async function getAllAccessories(tenantId: number) {
  return await db
    .select()
    .from(accessoryTable)
    .where(
      and(eq(accessoryTable.tenant_id, tenantId), eq(accessoryTable.is_deleted, false))
    )
    .orderBy(desc(accessoryTable.datetime));
}

export async function getAccessoriesByFilter(
  tenantId: number,
  filters: {
    name?: string;
    brand?: string;
    category?: string;
    color?: string;
    deposit?: string;
    gift?: boolean;
    is_deleted?: boolean;
  }
) {
  const conditions = [
    eq(accessoryTable.tenant_id, tenantId),
    filters.is_deleted === undefined
      ? eq(accessoryTable.is_deleted, false)
      : eq(accessoryTable.is_deleted, filters.is_deleted),
  ];

  if (filters.name?.trim()) conditions.push(ilike(accessoryTable.name, `%${filters.name.trim()}%`));
  if (filters.brand?.trim()) conditions.push(ilike(accessoryTable.brand, `%${filters.brand.trim()}%`));
  if (filters.category?.trim()) conditions.push(ilike(accessoryTable.category, `%${filters.category.trim()}%`));
  if (filters.color?.trim()) conditions.push(ilike(accessoryTable.color, `%${filters.color.trim()}%`));
  if (filters.deposit?.trim()) conditions.push(ilike(accessoryTable.deposit, `%${filters.deposit.trim()}%`));
  if (filters.gift !== undefined) conditions.push(eq(accessoryTable.gift, filters.gift));

  return await db
    .select()
    .from(accessoryTable)
    .where(and(...conditions))
    .orderBy(desc(accessoryTable.datetime));
}

export async function getAccessoryById(tenantId: number, accessoryId: number) {
  const rows = await db
    .select()
    .from(accessoryTable)
    .where(
      and(
        eq(accessoryTable.tenant_id, tenantId),
        eq(accessoryTable.accessory_id, accessoryId),
        eq(accessoryTable.is_deleted, false)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function addAccessory(data: NewAccessoryInput) {
  const rows = await db
    .insert(accessoryTable)
    .values({
      tenant_id: data.tenant_id,
      datetime: data.datetime,
      name: normalizeShortString(data.name),
      brand: normalizeShortString(data.brand),
      stock: data.stock ?? 0,
      color: data.color ? normalizeShortString(data.color) : null,
      category: data.category,
      price: data.price,
      buy_cost: data.buy_cost,
      deposit: data.deposit,
      gift: data.gift ?? false,
    })
    .returning();

  return rows[0];
}

export async function updateAccessory(
  tenantId: number,
  accessoryId: number,
  data: UpdateAccessoryInput
) {
  const rows = await db
    .update(accessoryTable)
    .set({
      datetime: data.datetime,
      name: normalizeShortString(data.name),
      brand: normalizeShortString(data.brand),
      stock: data.stock,
      color: data.color ? normalizeShortString(data.color) : null,
      category: data.category,
      price: data.price,
      buy_cost: data.buy_cost,
      deposit: data.deposit,
      gift: data.gift,
    })
    .where(
      and(
        eq(accessoryTable.tenant_id, tenantId),
        eq(accessoryTable.accessory_id, accessoryId),
        eq(accessoryTable.is_deleted, false)
      )
    )
    .returning();

  return rows[0] ?? null;
}

export async function softDeleteAccessory(tenantId: number, accessoryId: number) {
  const rows = await db
    .update(accessoryTable)
    .set({ is_deleted: true })
    .where(
      and(
        eq(accessoryTable.tenant_id, tenantId),
        eq(accessoryTable.accessory_id, accessoryId),
        eq(accessoryTable.is_deleted, false)
      )
    )
    .returning({ id: accessoryTable.accessory_id });

  return rows.length > 0;
}

/**
 * Total invertido en stock:
 * SUM(buy_cost * stock) solo accesorios activos (no deleted)
 */
export async function getAccessoryStockInvestment(tenantId: number) {
  const rows = await db
    .select({
      total: sql<string>`COALESCE(SUM(${accessoryTable.buy_cost} * ${accessoryTable.stock}), 0)::numeric`,
    })
    .from(accessoryTable)
    .where(
      and(eq(accessoryTable.tenant_id, tenantId), eq(accessoryTable.is_deleted, false))
    );

  return rows[0]?.total ?? "0";
}

/**
 * Breakdown por categoría (podés cambiar a brand, deposit, etc.)
 */
export async function getAccessoryStockInvestmentBreakdown(tenantId: number) {
  const rows = await db
    .select({
      category: accessoryTable.category,
      total: sql<string>`COALESCE(SUM(${accessoryTable.buy_cost} * ${accessoryTable.stock}), 0)::numeric`,
      units: sql<number>`COALESCE(SUM(${accessoryTable.stock}), 0)::int`,
    })
    .from(accessoryTable)
    .where(
      and(eq(accessoryTable.tenant_id, tenantId), eq(accessoryTable.is_deleted, false))
    )
    .groupBy(accessoryTable.category)
    .orderBy(desc(sql`SUM(${accessoryTable.buy_cost} * ${accessoryTable.stock})`));

  return rows;
}

export async function adjustAccessoryStock(
  tenantId: number,
  accessoryId: number,
  delta: number
) {
  if (!Number.isInteger(delta)) {
    throw new Error("delta must be an integer");
  }


  const whereClause =
    delta >= 0
      ? and(
          eq(accessoryTable.tenant_id, tenantId),
          eq(accessoryTable.accessory_id, accessoryId),
          eq(accessoryTable.is_deleted, false)
        )
      : and(
          eq(accessoryTable.tenant_id, tenantId),
          eq(accessoryTable.accessory_id, accessoryId),
          eq(accessoryTable.is_deleted, false),
          gte(accessoryTable.stock, -delta)
        );

  const rows = await db
    .update(accessoryTable)
    .set({
      stock: sql<number>`${accessoryTable.stock} + ${delta}`,
    })
    .where(whereClause)
    .returning({
      accessory_id: accessoryTable.accessory_id,
      stock: accessoryTable.stock,
    });
  return rows[0] ?? null;
}
