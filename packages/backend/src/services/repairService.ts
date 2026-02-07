import { db } from "@server/db/db";
import { repairTable, clientTable, technicianTable, phoneTable } from "@server/db/schema.ts";
import { and, eq, sql, gte, lte } from "drizzle-orm";
import { normalizeShortString } from "../util/formattersBackend";

// ---- tenant checks (multi-tenant hard rule) ----
async function assertTenantClient(tenantId: number, clientId: number) {
  const rows = await db
    .select({ id: clientTable.client_id })
    .from(clientTable)
    .where(and(eq(clientTable.tenant_id, tenantId), eq(clientTable.client_id, clientId)))
    .limit(1);

  if (!rows[0]) throw new Error("INVALID_CLIENT");
}

async function assertTenantTechnician(tenantId: number, technicianId: number) {
  const rows = await db
    .select({ id: technicianTable.technician_id })
    .from(technicianTable)
    .where(and(eq(technicianTable.tenant_id, tenantId), eq(technicianTable.technician_id, technicianId)))
    .limit(1);

  if (!rows[0]) throw new Error("INVALID_TECHNICIAN");
}

async function assertTenantDevice(tenantId: number, deviceId: number) {
  const rows = await db
    .select({ id: phoneTable.device_id })
    .from(phoneTable)
    .where(and(eq(phoneTable.tenant_id, tenantId), eq(phoneTable.device_id, deviceId)))
    .limit(1);

  if (!rows[0]) throw new Error("INVALID_DEVICE");
}

// ------------------ queries ------------------

export const getRepairsByFilter = async (
  tenantId: number,
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
        eq(repairTable.tenant_id, tenantId),

        filters.date ? eq(sql`date(${repairTable.datetime})`, filters.date) : undefined,
        filters.repair_state ? eq(repairTable.repair_state, filters.repair_state) : undefined,
        filters.priority ? eq(repairTable.priority, filters.priority) : undefined,

        filters.client_id ? eq(repairTable.client_id, Number(filters.client_id)) : undefined,
        filters.technician_id ? eq(repairTable.technician_id, Number(filters.technician_id)) : undefined,
        filters.device_id ? eq(repairTable.device_id, Number(filters.device_id)) : undefined,

        filters.cost_min ? gte(repairTable.client_cost, filters.cost_min) : undefined,
        filters.cost_max ? lte(repairTable.client_cost, filters.cost_max) : undefined,

        filters.is_deleted !== undefined ? eq(repairTable.is_deleted, filters.is_deleted) : undefined
      )
    )
    .orderBy(repairTable.datetime);
};

export const getAllRepairs = async (tenantId: number) => {
  return await db
    .select()
    .from(repairTable)
    .where(eq(repairTable.tenant_id, tenantId))
    .orderBy(repairTable.repair_id);
};

// ------------------ mutations ------------------

export const addRepair = async (
  tenantId: number,
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
  // ✅ validate tenant ownership before insert
  await assertTenantClient(tenantId, newRepair.client_id);
  await assertTenantTechnician(tenantId, newRepair.technician_id);
  await assertTenantDevice(tenantId, newRepair.device_id);

  const normalizedRepair = {
    ...newRepair,
    tenant_id: tenantId, // ✅ fuerza server-side
    repair_state: normalizeShortString(newRepair.repair_state),
    priority: normalizeShortString(newRepair.priority),
    description: newRepair.description.trim(),
    diagnostic: newRepair.diagnostic ? newRepair.diagnostic.trim() : undefined,
    client_cost: newRepair.client_cost,
    internal_cost: newRepair.internal_cost,
  };

  return await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(repairTable)
      .values(normalizedRepair)
      .returning();

    const upd = await tx
      .update(phoneTable)
      .set({ in_repair: true })
      .where(
        and(
          eq(phoneTable.tenant_id, tenantId),
          eq(phoneTable.device_id, newRepair.device_id),
        )
      )
      .returning({ device_id: phoneTable.device_id });

    if (upd.length === 0) {
      throw new Error("DEVICE_UPDATE_FAILED");
    }

    return inserted;
  });
};

export const updateRepair = async (
  tenantId: number,
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
    await assertTenantClient(tenantId, repair_upd.client_id);
  }
  if (repair_upd.technician_id !== undefined) {
    await assertTenantTechnician(tenantId, repair_upd.technician_id);
  }
  if (repair_upd.device_id !== undefined) {
    await assertTenantDevice(tenantId, repair_upd.device_id);
  }

  const normalizedUpd = {
    ...repair_upd,
    repair_state: repair_upd.repair_state ? normalizeShortString(repair_upd.repair_state) : undefined,
    priority: repair_upd.priority ? normalizeShortString(repair_upd.priority) : undefined,
    description: repair_upd.description ? repair_upd.description.trim() : undefined,
    diagnostic: repair_upd.diagnostic ? repair_upd.diagnostic.trim() : undefined,
  };

  return await db.transaction(async (tx) => {
    // 1) Traigo el registro actual para saber device_id y estado previo
    const prev = await tx
      .select({
        device_id: repairTable.device_id,
        repair_state: repairTable.repair_state,
      })
      .from(repairTable)
      .where(and(eq(repairTable.tenant_id, tenantId), eq(repairTable.repair_id, repair_id)))
      .limit(1);

    if (!prev[0]) throw new Error("REPAIR_NOT_FOUND");

    const prevState = normalizeShortString(String(prev[0].repair_state ?? ""));
    const nextState =
      normalizedUpd.repair_state !== undefined ? normalizedUpd.repair_state : prevState;

    // Si cambian el device_id en el update, usamos el nuevo; si no, el anterior
    const targetDeviceId = normalizedUpd.device_id ?? prev[0].device_id;

    // 2) Update repair
    const updated = await tx
      .update(repairTable)
      .set(normalizedUpd)
      .where(and(eq(repairTable.tenant_id, tenantId), eq(repairTable.repair_id, repair_id)))
      .returning();

    // 3) Si pasa a "listo" (y antes no lo estaba), liberar el dispositivo
    if (nextState === "entregado" && prevState !== "entregado") {
      const updPhone = await tx
        .update(phoneTable)
        .set({ in_repair: false })
        .where(and(eq(phoneTable.tenant_id, tenantId), eq(phoneTable.device_id, targetDeviceId)))
        .returning({ device_id: phoneTable.device_id });

      if (updPhone.length === 0) throw new Error("DEVICE_UPDATE_FAILED");
    }

    return updated;
  });
};

export async function softDeleteRepair(tenantId: number, id: number) {
  const result = await db
    .update(repairTable)
    .set({ is_deleted: true })
    .where(and(eq(repairTable.tenant_id, tenantId), eq(repairTable.repair_id, id)))
    .returning();

  return result.length > 0;
}
