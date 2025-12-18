import { db } from "@server/db/db";
import { repairTable } from "@server/db/schema.ts";
import { ilike, and, eq, sql, is, gte, lte } from "drizzle-orm"
import { normalizeShortString } from "../util/formattersBackend";

export const getRepairsByFilter = async (filters: {
  date?: string;
  repair_state?: string;
  priority?: string;
  client_id?: string;
  technician_id?: string;
  device_id?: string;
  cost_min?: string;
  cost_max?: string;
  is_deleted?: boolean;
}) => {
    console.log("filters.is_deleted:", filters.is_deleted, typeof filters.is_deleted);

  return await db
    .select()
    .from(repairTable)
    .where(
      and(
        filters.date
          ? eq(sql`date(${repairTable.datetime})`, filters.date)
          : undefined,

        filters.repair_state
          ? eq(repairTable.repair_state, filters.repair_state)
          : undefined,

        filters.priority
          ? eq(repairTable.priority, filters.priority)
          : undefined,

        filters.client_id
          ? eq(repairTable.client_id, Number(filters.client_id))
          : undefined,

        filters.technician_id
          ? eq(repairTable.technician_id, Number(filters.technician_id))
          : undefined,

        filters.device_id
          ? eq(repairTable.device_id, Number(filters.device_id))
          : undefined,

        filters.cost_min
          ? gte(repairTable.client_cost, filters.cost_min)
          : undefined,

        filters.cost_max
          ? lte(repairTable.client_cost, filters.cost_max)
          : undefined,

        filters.is_deleted !== undefined
          ? eq(repairTable.is_deleted, filters.is_deleted)
          : undefined,
      )
    )
    .orderBy(repairTable.datetime);
};


export const getAllRepairs = async () => {
    return await db.select().from(repairTable).orderBy(repairTable.repair_id);
}

export const addRepair = async (
    newRepair: {
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
    const normalizedRepair = {
        ...newRepair,
        repair_state: normalizeShortString(newRepair.repair_state),
        priority: normalizeShortString(newRepair.priority),
        description: newRepair.description.trim(),
        diagnostic: newRepair.diagnostic
            ? newRepair.diagnostic.trim()
            : undefined,
        client_cost: newRepair.client_cost,
        internal_cost: newRepair.internal_cost,
    };
        const result = await db
        .insert(repairTable)
        .values(normalizedRepair)
        .returning();

    return result;
}

export const updateRepair = async (
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
    const result = await db
        .update(repairTable)
        .set(repair_upd)
        .where(eq(repairTable.repair_id, repair_id))
        .returning();
    
    return result;
}

export async function softDeleteRepair(id: number) {
    const result = await db
        .update(repairTable)
        .set({ is_deleted: true })
        .where(eq(repairTable.repair_id, id))
        .returning();

    return result.length > 0;
}