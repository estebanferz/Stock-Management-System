import { technicianTable } from "@server/db/schema.ts";
import { db } from "@server/db/db.ts";
import { eq } from "drizzle-orm";  
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { normalizeShortString } from "../util/formattersBackend";

export const getAllTechnicians = async () => {
    return await db.select().from(technicianTable).where(eq(technicianTable.is_deleted, false)).orderBy(technicianTable.technician_id);
}

export const getTechnicianById = async(id: number) => {
    const technician = await db.query.technicianTable.findFirst({
        where: eq(technicianTable.technician_id, id),
    });
    
    
    return technician;
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