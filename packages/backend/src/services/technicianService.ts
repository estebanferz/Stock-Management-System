import { technicianTable } from "@server/db/schema.ts";
import { db } from "@server/db/db";
import { and, eq, ilike } from "drizzle-orm";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { normalizeShortString } from "../util/formattersBackend";

function normalizeEmail(email?: string) {
  if (!email) return undefined;
  const e = email.trim().toLowerCase();
  return e === "" ? undefined : e;
}

function normalizePhoneE164AR(phone?: string) {
  if (!phone) return undefined;
  const raw = phone.trim();
  if (!raw) return undefined;

  const parsed = parsePhoneNumberFromString(raw, "AR");
  if (parsed && parsed.isValid()) return parsed.format("E.164");

  // si viene inválido, preferible limpiar a undefined (o tirar error si querés strict)
  return undefined;
}

export const getAllTechnicians = async (tenantId: number) => {
  return await db
    .select()
    .from(technicianTable)
    .where(eq(technicianTable.tenant_id, tenantId))
    .orderBy(technicianTable.technician_id);
};

export const getTechnicianById = async (tenantId: number, id: number) => {
  const technician = await db.query.technicianTable.findFirst({
    where: and(
      eq(technicianTable.tenant_id, tenantId),
      eq(technicianTable.technician_id, id)
    ),
  });

  return technician;
};

export async function getTechniciansByFilter(
  tenantId: number,
  filters: {
    name?: string;
    speciality?: string;
    state?: string;
    email?: string;
    phone_number?: string;
    is_deleted?: boolean;
  }
) {
  return await db
    .select()
    .from(technicianTable)
    .where(
      and(
        eq(technicianTable.tenant_id, tenantId),

        filters.name ? ilike(technicianTable.name, `%${filters.name}%`) : undefined,
        filters.speciality
          ? ilike(technicianTable.speciality, `%${filters.speciality}%`)
          : undefined,
        filters.state ? ilike(technicianTable.state, `%${filters.state}%`) : undefined,
        filters.email ? ilike(technicianTable.email, `%${filters.email}%`) : undefined,
        filters.phone_number
          ? ilike(technicianTable.phone_number, `%${filters.phone_number}%`)
          : undefined,

        filters.is_deleted !== undefined
          ? eq(technicianTable.is_deleted, filters.is_deleted)
          : undefined
      )
    )
    .orderBy(technicianTable.technician_id);
}

export const addTechnician = async (
  tenantId: number,
  newTechnician: {
    tenant_id: number;
    name: string;
    email?: string;
    phone_number?: string;
    speciality: string;
    state: string;
  }
) => {
  const normalizedTechnician = {
    ...newTechnician,
    tenant_id: tenantId, // ✅ force server-side
    name: normalizeShortString(newTechnician.name),
    speciality: normalizeShortString(newTechnician.speciality),
    state: normalizeShortString(newTechnician.state),
    email: normalizeEmail(newTechnician.email),
    phone_number: normalizePhoneE164AR(newTechnician.phone_number),
  };

  return await db.insert(technicianTable).values(normalizedTechnician).returning();
};

export const updateTechnician = async (
  tenantId: number,
  technician_id: number,
  technician_upd: {
    name?: string;
    email?: string;
    phone_number?: string;
    speciality?: string;
    state?: string;
  }
) => {
  const normalizedUpd = {
    ...technician_upd,
    name: technician_upd.name ? normalizeShortString(technician_upd.name) : undefined,
    speciality: technician_upd.speciality
      ? normalizeShortString(technician_upd.speciality)
      : undefined,
    state: technician_upd.state ? normalizeShortString(technician_upd.state) : undefined,
    email: technician_upd.email !== undefined ? normalizeEmail(technician_upd.email) : undefined,
    phone_number:
      technician_upd.phone_number !== undefined
        ? normalizePhoneE164AR(technician_upd.phone_number)
        : undefined,
  };

  const result = await db
    .update(technicianTable)
    .set(normalizedUpd)
    .where(
      and(
        eq(technicianTable.tenant_id, tenantId),
        eq(technicianTable.technician_id, technician_id)
      )
    )
    .returning();

  return result;
};

// (si ya no la usás, podés borrarla)
export const deleteTechnician = async (tenantId: number, technician_id: number) => {
  const result = await db
    .delete(technicianTable)
    .where(
      and(
        eq(technicianTable.tenant_id, tenantId),
        eq(technicianTable.technician_id, technician_id)
      )
    )
    .returning();

  return result.length > 0;
};

export async function softDeleteTechnician(tenantId: number, id: number) {
  const result = await db
    .update(technicianTable)
    .set({ is_deleted: true })
    .where(
      and(eq(technicianTable.tenant_id, tenantId), eq(technicianTable.technician_id, id))
    )
    .returning();

  return result.length > 0;
}
