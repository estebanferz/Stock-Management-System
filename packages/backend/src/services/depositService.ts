import { db } from "../../db/db";
import { depositTable, phoneTable, headphoneTable, accessoryTable } from "../../db/schema";
import { eq, and, ilike, sql } from "drizzle-orm";
import { normalizeShortString } from "@server/src/util/formattersBackend";

export async function getAllDeposits(tenantId: number) {
  return await db
    .select()
    .from(depositTable)
    .where(and(eq(depositTable.tenant_id, tenantId), eq(depositTable.is_deleted, false)))
    .orderBy(depositTable.deposit_id);
}

export async function getDepositById(tenantId: number, id: number) {
  return await db.query.depositTable.findFirst({
    where: and(eq(depositTable.tenant_id, tenantId), eq(depositTable.deposit_id, id)),
  });
}

export async function addDeposit(newDeposit: {
  tenant_id: number;
  name: string;
  address?: string;
}) {
  const normalized = {
    ...newDeposit,
    name: normalizeShortString(newDeposit.name),
  };

  return await db
    .insert(depositTable)
    .values(normalized)
    .returning();
}

export async function updateDeposit(
  tenantId: number,
  id: number,
  upd: { name?: string; address?: string }
) {
  return await db
    .update(depositTable)
    .set({
      ...(upd.name && { name: normalizeShortString(upd.name) }),
      ...(upd.address && { address: upd.address }),
    })
    .where(and(eq(depositTable.tenant_id, tenantId), eq(depositTable.deposit_id, id)))
    .returning();
}

export async function softDeleteDeposit(tenantId: number, id: number) {
  const result = await db
    .update(depositTable)
    .set({ is_deleted: true })
    .where(and(eq(depositTable.tenant_id, tenantId), eq(depositTable.deposit_id, id)))
    .returning();

  return result.length > 0;
}

/**
 * Obtiene los depósitos con el conteo de stock consolidado
 * Útil para el carrusel de Zuma+
 */
// En depositService.ts

export async function getDepositsWithStock(tenantId: number) {
  const tid = Number(tenantId);
  const deposits = await getAllDeposits(tid);

  const result = await Promise.all(
    deposits.map(async (d) => {
      // Conteo Teléfonos
      const phones = await db
        .select({ count: sql<number>`count(*)` })
        .from(phoneTable)
        .where(and(
          eq(phoneTable.tenant_id, tid), 
          eq(phoneTable.deposit, d.name), 
          eq(phoneTable.sold, false), 
          eq(phoneTable.is_deleted, false)
        ));

      // Conteo Auriculares
      const headphones = await db
        .select({ count: sql<number>`count(*)` })
        .from(headphoneTable)
        .where(and(
          eq(headphoneTable.tenant_id, tid), 
          eq(headphoneTable.deposit, d.name), 
          eq(headphoneTable.sold, false), 
          eq(headphoneTable.is_deleted, false)
        ));

      // Suma Accesorios
      const accessories = await db
        .select({ total: sql<number>`sum(${accessoryTable.stock})` })
        .from(accessoryTable)
        .where(and(
          eq(accessoryTable.tenant_id, tid), 
          eq(accessoryTable.deposit, d.name),
          eq(accessoryTable.is_deleted, false)
        ));

      const pCount = Number(phones[0]?.count || 0);
      const hCount = Number(headphones[0]?.count || 0);
      const aCount = Number(accessories[0]?.total || 0);

      return {
        ...d,
        stock_breakdown: {
          phones: pCount,
          headphones: hCount,
          accessories: aCount,
          total: pCount + hCount + aCount
        }
      };
    })
  );

  return result;
}