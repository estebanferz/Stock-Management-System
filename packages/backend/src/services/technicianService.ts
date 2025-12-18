import { technicianTable } from "@server/db/schema.ts";
import { db } from "@server/db/db";
import { and, eq, ilike } from "drizzle-orm";
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { normalizeShortString } from "../util/formattersBackend";

export const getAllTechnicians = async () => {
    return await db.select().from(technicianTable).orderBy(technicianTable.technician_id);
}

export const getTechnicianById = async(id: number) => {
    const technician = await db.query.technicianTable.findFirst({
        where: eq(technicianTable.technician_id, id),
    });
    
    return technician;
}

export async function getTechniciansByFilter(filters: {
  name?: string;
  speciality?: string;
  state?: string;
  email?: string;
  phone_number?: string;
  is_deleted?: boolean;
}) {
  return await db
    .select()
    .from(technicianTable)
    .where(
      and(
        filters.name ? ilike(technicianTable.name, `%${filters.name}%`) : undefined,
        filters.speciality ? ilike(technicianTable.speciality, `%${filters.speciality}%`) : undefined,
        filters.state ? ilike(technicianTable.state, `%${filters.state}%`) : undefined,
        filters.email ? ilike(technicianTable.email, `%${filters.email}%`) : undefined,
        filters.phone_number ? ilike(technicianTable.phone_number, `%${filters.phone_number}%`) : undefined,

        filters.is_deleted !== undefined
          ? eq(technicianTable.is_deleted, filters.is_deleted)
          : undefined,
      )
    )
    .orderBy(technicianTable.technician_id);
}


export const addTechnician = async (newTechnician: {
    name: string;
    email?: string;
    phone_number?: string;
    speciality: string;
    state: string;
}) => {

    //Normalize email
    if (newTechnician.email) {
        newTechnician.email = newTechnician.email.trim().toLowerCase();
    }

    if (newTechnician.phone_number) {
        newTechnician.phone_number = newTechnician.phone_number.trim();
    }

    const normalizedTechnician = {
        ...newTechnician,
        name: normalizeShortString(newTechnician.name),
        speciality: newTechnician.speciality?.trim(),
        state: normalizeShortString(newTechnician.state),
        email: newTechnician.email?.trim().toLowerCase(),
        phone_number: newTechnician.phone_number?.trim(),
    };

    const result = await db
        .insert(technicianTable)
        .values(normalizedTechnician)
        .returning();

    return result;
}  

export const updateTechnician = async (
    technician_id: number,
    technician_upd: {
        name: string;
        email?: string;
        phone_number?: string;
        speciality: string;
        state: string;
    },
) => {
    //Normalize email
    if (technician_upd.email) {
        technician_upd.email = technician_upd.email.trim().toLowerCase();
    }

    //Validate and format phone number
    if (technician_upd.phone_number) {
        const phoneNumber = parsePhoneNumberFromString(technician_upd.phone_number, 'AR');

        if (phoneNumber && phoneNumber.isValid()) {
            // Format to standard E.164
            technician_upd.phone_number = phoneNumber.format('E.164');
        } else {
            technician_upd.phone_number = undefined;
        }
    }

    const result = await db
        .update(technicianTable)
        .set(technician_upd)
        .where(eq(technicianTable.technician_id, technician_id))
        .returning();

    if (result) {return true}
    else {return false}
}

export const deleteTechnician = async (technician_id: number) => {
    const result = await db
        .delete(technicianTable)
        .where(eq(technicianTable.technician_id, technician_id))
        .returning();

    if (result) {return true}
    else {return false}
}

export async function softDeleteTechnician(id: number) {
    const result = await db
        .update(technicianTable)
        .set({ is_deleted: true })
        .where(eq(technicianTable.technician_id, id))
        .returning();

    return result.length > 0;
}