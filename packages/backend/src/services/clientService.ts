import { db } from '../../db/db';
import { clientTable } from '../../db/schema';
import { eq, and, ilike, gte, gt, sql } from "drizzle-orm";
import { clientUpdateDTO } from "@server/db/types";
import { normalizeShortString } from "@server/src/util/formattersBackend";


export async function getClientByFilter(
    name?: string,
    id_number?: string,
    email?: string,
    phone_number?: string,
    is_deleted?: boolean,
){

    const result = await db
    .select()
    .from(clientTable)
    .where(
      and(
        name ? ilike(clientTable.name, `%${name}%`) : undefined,
        id_number ? eq(clientTable.id_number, Number(id_number)) : undefined, 
        email ? ilike(clientTable.email, `%${email}%`) : undefined,
        phone_number ? ilike(clientTable.phone_number, `%${phone_number}%`) : undefined,
        is_deleted !== undefined ? eq(clientTable.is_deleted, is_deleted) : undefined,
      ),
    ).orderBy(clientTable.client_id);
    
    return result;
}

export async function getAllClients() {
    return await db.select().from(clientTable).orderBy(clientTable.client_id);
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

    return result;
}

export const addClient = async (newClient: {
    name: string;
    email?: string;
    phone_number?: string;
    id_number: number;
    birth_date?: string;
    debt?: number;
}) => {
    const normalizedClient = {
        ...newClient,
        name: normalizeShortString(newClient.name),
        email: newClient.email?.toLowerCase().trim(),
    };
    const result = await db
        .insert(clientTable)
        .values(normalizedClient)
        .returning();

    return result;
}

export async function softDeleteClient(id: number) {
    const result = await db
        .update(clientTable)
        .set({ is_deleted: true })
        .where(eq(clientTable.client_id, id))
        .returning();

    return result.length > 0;
}

export const getDebts = async() => {
    const debts = await db
        .select()
        .from(clientTable)
        .where(and(gt(clientTable.debt, 0), eq(clientTable.is_deleted, false)));

    console.log(debts);
    return debts;
}

export const getTotalDebt = async() => {
    const debts = await db
        .select({
            total_debt: sql`SUM(${clientTable.debt})`,
        })
        .from(clientTable)
        .where(and(eq(clientTable.is_deleted, false)));
    
    const { total_debt } = debts[0] ?? { total_debt: 0 };

    const debt = Number(total_debt);

    return Number(debt);
}