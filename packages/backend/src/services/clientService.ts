import { db } from '../../db/db';
import { clientTable } from '../../db/schema';
import { eq, and, ilike } from "drizzle-orm";
import { clientUpdateDTO } from "@server/db/types";


export async function getClientByFilter(
    name?: string,
    id_number?: string,
    email?: string,
    phone_number?: string,
){

    const result = await db
    .select()
    .from(clientTable)
    .where(
      and(
        name ? ilike(clientTable.name, `%${name}%`) : undefined,
        id_number ? eq(clientTable.id_number, Number(id_number)) : undefined, // ya convertido y validado
        email ? ilike(clientTable.email, `%${email}%`) : undefined,
        phone_number ? ilike(clientTable.phone_number, `%${phone_number}%`) : undefined,
      ),
    );
    
    return result;
}

export async function getAllClients() {
    return await db.select().from(clientTable);
}

export const getClientById = async(id: number) => {
    const sale = await db.query.clientTable.findFirst({
        where: eq(clientTable.client_id, id),
    });
    return sale;
}

export async function updateClient(
    client_id: number,
    client_upd: typeof clientUpdateDTO.static,
){
    const result = await db
        .update(clientTable)
        .set(client_upd)
        .where(eq(clientTable.client_id, client_id))
        .returning();

    if (result) {return true}
    else {return false}
}

export const addClient = async (newClient: {
    name: string;
    email?: string;
    phone_number?: string;
    id_number: number;
    birth_date?: string;
}) => {
    const result = await db
        .insert(clientTable)
        .values(newClient)
        .returning();

    return result;
}

export const deleteClient = async (client_id: number) => {
    const result = await db
        .delete(clientTable)
        .where(eq(clientTable.client_id, client_id))
        .returning();

    if (result.length > 0) {
        return true;
    } else {
        return false;
    }
}