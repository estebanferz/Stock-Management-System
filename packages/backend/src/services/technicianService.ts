import { technicianTable } from "@server/db/schema.ts";
import { db } from "@server/db/db";
import { and, eq, ilike } from "drizzle-orm";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { normalizeShortString } from "../util/formattersBackend";

export const getAllTechnicians = async (userId: number) => {
  return await db
    .select()
    .from(technicianTable)
    .where(eq(technicianTable.user_id, userId)) 
    .orderBy(technicianTable.technician_id);
};

export const getTechnicianById = async (userId: number, id: number) => {
  const technician = await db.query.technicianTable.findFirst({
    where: and(eq(technicianTable.user_id, userId), eq(technicianTable.technician_id, id)),
  });

  return technician;
};

export async function getTechniciansByFilter(
  userId: number,
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
        eq(technicianTable.user_id, userId),

        filters.name ? ilike(technicianTable.name, `%${filters.name}%`) : undefined,
        filters.speciality ? ilike(technicianTable.speciality, `%${filters.speciality}%`) : undefined,
        filters.state ? ilike(technicianTable.state, `%${filters.state}%`) : undefined,
        filters.email ? ilike(technicianTable.email, `%${filters.email}%`) : undefined,
        filters.phone_number ? ilike(technicianTable.phone_number, `%${filters.phone_number}%`) : undefined,

        filters.is_deleted !== undefined ? eq(technicianTable.is_deleted, filters.is_deleted) : undefined
      )
    )
    .orderBy(technicianTable.technician_id);
}

export const addTechnician = async (
  userId: number,
  newTechnician: {
    user_id: number;
    name: string;
    email?: string;
    phone_number?: string;
    speciality: string;
    state: string;
  }
) => {
  // Normalize email
  const email = newTechnician.email ? newTechnician.email.trim().toLowerCase() : undefined;

  // Normalize phone 
  const phone_number = newTechnician.phone_number ? newTechnician.phone_number.trim() : undefined;

  const normalizedTechnician = {
    ...newTechnician,
    user_id: userId, // ✅ force server-side
    name: normalizeShortString(newTechnician.name),
    speciality: normalizeShortString(newTechnician.speciality),
    state: normalizeShortString(newTechnician.state),
    email,
    phone_number,
  };

  const result = await db.insert(technicianTable).values(normalizedTechnician).returning();
  return result;
};

export const updateTechnician = async (
  userId: number,
  technician_id: number,
  technician_upd: {
    name: string;
    email?: string;
    phone_number?: string;
    speciality: string;
    state: string;
  }
) => {
  // Normalize email
  if (technician_upd.email) {
    technician_upd.email = technician_upd.email.trim().toLowerCase();
  }

  // Validate and format phone number
  if (technician_upd.phone_number) {
    const phoneNumber = parsePhoneNumberFromString(technician_upd.phone_number, "AR");

    if (phoneNumber && phoneNumber.isValid()) {
      technician_upd.phone_number = phoneNumber.format("E.164");
    } else {
      technician_upd.phone_number = undefined;
    }
  }

  const normalizedUpd = {
    ...technician_upd,
    name: technician_upd.name ? normalizeShortString(technician_upd.name) : undefined,
    speciality: technician_upd.speciality ? normalizeShortString(technician_upd.speciality) : undefined,
    state: technician_upd.state ? normalizeShortString(technician_upd.state) : undefined,
    email: technician_upd.email?.trim().toLowerCase(),
    phone_number: technician_upd.phone_number?.trim(),
  };

  const result = await db
    .update(technicianTable)
    .set(normalizedUpd)
    .where(
      and(
        eq(technicianTable.user_id, userId),
        eq(technicianTable.technician_id, technician_id)
      )
    )
    .returning();

  return result;
};

export const deleteTechnician = async (userId: number, technician_id: number) => {
  const result = await db
    .delete(technicianTable)
    .where(and(eq(technicianTable.user_id, userId), eq(technicianTable.technician_id, technician_id)))
    .returning();

  return result.length > 0;
};

export async function softDeleteTechnician(userId: number, id: number) {
  const result = await db
    .update(technicianTable)
    .set({ is_deleted: true })
    .where(and(eq(technicianTable.user_id, userId), eq(technicianTable.technician_id, id)))
    .returning();

  return result.length > 0;
}
