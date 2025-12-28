import { db } from "@server/db/db";
import { repairTable, clientTable, technicianTable, phoneTable } from "@server/db/schema.ts";
import { and, eq, sql, gte, lte } from "drizzle-orm";
import { normalizeShortString } from "../util/formattersBackend";

// ---- ownership checks (multi-tenant hard rule) ----
async function assertOwnedClient(userId: number, clientId: number) {
  const rows = await db
    .select({ id: clientTable.client_id })
    .from(clientTable)
    .where(and(eq(clientTable.user_id, userId), eq(clientTable.client_id, clientId)))
    .limit(1);

  if (!rows[0]) throw new Error("INVALID_CLIENT");
}

async function assertOwnedTechnician(userId: number, technicianId: number) {
  const rows = await db
    .select({ id: technicianTable.technician_id })
    .from(technicianTable)
    .where(and(eq(technicianTable.user_id, userId), eq(technicianTable.technician_id, technicianId)))
    .limit(1);

  if (!rows[0]) throw new Error("INVALID_TECHNICIAN");
}

async function assertOwnedDevice(userId: number, deviceId: number) {
  const rows = await db
    .select({ id: phoneTable.device_id })
    .from(phoneTable)
    .where(and(eq(phoneTable.user_id, userId), eq(phoneTable.device_id, deviceId)))
    .limit(1);

  if (!rows[0]) throw new Error("INVALID_DEVICE");
}

// ------------------ queries ------------------

export const getRepairsByFilter = async (
  userId: number,
  filters: {
    date?: string;
    repair_state?: string;
    priority?: string;
    client_id?: string;
    technician_id?: string;
    device_id?: string;
    cost_min?: string;
    cost_max?: string;
    is_deleted?: boolean;
  }
) => {
  return await db
    .select()
    .from(repairTable)
    .where(
      and(
        eq(repairTable.user_id, userId), // ✅ multi-tenant always

        filters.date ? eq(sql`date(${repairTable.datetime})`, filters.date) : undefined,
        filters.repair_state ? eq(repairTable.repair_state, filters.repair_state) : undefined,
        filters.priority ? eq(repairTable.priority, filters.priority) : undefined,

        filters.client_id ? eq(repairTable.client_id, Number(filters.client_id)) : undefined,
        filters.technician_id
          ? eq(repairTable.technician_id, Number(filters.technician_id))
          : undefined,
        filters.device_id ? eq(repairTable.device_id, Number(filters.device_id)) : undefined,

        filters.cost_min ? gte(repairTable.client_cost, filters.cost_min) : undefined,
        filters.cost_max ? lte(repairTable.client_cost, filters.cost_max) : undefined,

        filters.is_deleted !== undefined ? eq(repairTable.is_deleted, filters.is_deleted) : undefined
      )
    )
    .orderBy(repairTable.datetime);
};

export const getAllRepairs = async (userId: number) => {
  return await db
    .select()
    .from(repairTable)
    .where(eq(repairTable.user_id, userId)) // ✅
    .orderBy(repairTable.repair_id);
};

// ------------------ mutations ------------------

export const addRepair = async (
  userId: number,
  newRepair: {
    user_id: number; // viene desde controller
    datetime?: Date;
    repair_state: string;
    priority: string;
    description: string;
    diagnostic?: string;
    client_cost: string;
    internal_cost: string;
    client_id: number;
    technician_id: number;
    device_id: number;
  }
) => {
  // ✅ validate ownership before insert
  await assertOwnedClient(userId, newRepair.client_id);
  await assertOwnedTechnician(userId, newRepair.technician_id);
  await assertOwnedDevice(userId, newRepair.device_id);

  const normalizedRepair = {
    ...newRepair,
    user_id: userId, // ✅ fuerza server-side (no confíes en body)
    repair_state: normalizeShortString(newRepair.repair_state),
    priority: normalizeShortString(newRepair.priority),
    description: newRepair.description.trim(),
    diagnostic: newRepair.diagnostic ? newRepair.diagnostic.trim() : undefined,
    client_cost: newRepair.client_cost,
    internal_cost: newRepair.internal_cost,
  };

  const result = await db.insert(repairTable).values(normalizedRepair).returning();
  return result;
};

export const updateRepair = async (
  userId: number,
  repair_id: number,
  repair_upd: {
    repair_state?: string;
    priority?: string;
    description?: string;
    diagnostic?: string;
    client_cost?: string;
    internal_cost?: string;
    client_id?: number;
    technician_id?: number;
    device_id?: number;
    datetime?: Date;
  }
) => {
  if (repair_upd.client_id !== undefined) {
    await assertOwnedClient(userId, repair_upd.client_id);
  }
  if (repair_upd.technician_id !== undefined) {
    await assertOwnedTechnician(userId, repair_upd.technician_id);
  }
  if (repair_upd.device_id !== undefined) {
    await assertOwnedDevice(userId, repair_upd.device_id);
  }

  const normalizedUpd = {
    ...repair_upd,
    repair_state: repair_upd.repair_state ? normalizeShortString(repair_upd.repair_state) : undefined,
    priority: repair_upd.priority ? normalizeShortString(repair_upd.priority) : undefined,
    description: repair_upd.description ? repair_upd.description.trim() : undefined,
    diagnostic: repair_upd.diagnostic ? repair_upd.diagnostic.trim() : undefined,
  };

  const result = await db
    .update(repairTable)
    .set(normalizedUpd)
    .where(and(eq(repairTable.user_id, userId), eq(repairTable.repair_id, repair_id))) // ✅
    .returning();

  return result;
};

export async function softDeleteRepair(userId: number, id: number) {
  const result = await db
    .update(repairTable)
    .set({ is_deleted: true })
    .where(and(eq(repairTable.user_id, userId), eq(repairTable.repair_id, id))) // ✅
    .returning();

  return result.length > 0;
}
