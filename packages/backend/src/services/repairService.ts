import { db } from "@server/db/db";
import { repairTable } from "@server/db/schema.ts";
import { ilike, and, eq, sql } from "drizzle-orm"
import { normalizeShortString } from "../util/formattersBackend";

export const getRepairsByFilter = async (
    datetime?: string,
    repair_state?: string,
    priority?: string,
    client_id?: number,
    technician_id?: number,
    device_id?: number,
) => {
    const result = await db
        .select()
        .from(repairTable)
        .where(
            and(
                datetime? eq(sql`date(${repairTable.datetime})`, datetime) : undefined,
                repair_state? ilike(repairTable.repair_state, `%${repair_state}%`) : undefined,
                priority? ilike(repairTable.priority, `%${priority}%`) : undefined,
                client_id? eq(repairTable.client_id, client_id) : undefined,
                technician_id? eq(repairTable.technician_id, technician_id) : undefined,
                device_id? eq(repairTable.device_id, device_id) : undefined,
            )
        );

        return result;
}

export const getAllRepairs = async () => {
    return await db.select().from(repairTable);
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
    }
) => {
    const result = await db
        .update(repairTable)
        .set(repair_upd)
        .where(eq(repairTable.repair_id, repair_id))
        .returning();
    
    return result;
}

export const deleteRepair = async (repair_id: number) => {
    const result = await db
        .delete(repairTable)
        .where(eq(repairTable.repair_id, repair_id))
        .returning();

    if (result.length === 0) {
        return false;
    }

    return true;
}