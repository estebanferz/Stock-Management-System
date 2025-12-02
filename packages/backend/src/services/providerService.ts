import { db } from "@server/db/db";
import { providerTable } from "@server/db/schema.ts";
import { ilike, and, eq } from "drizzle-orm"

export async function getProviderByFilter(
    name?: string,
){

    const result = await db
    .select()
    .from(providerTable)
    .where(
      and(
        name ? ilike(providerTable.name, `%${name}%`) : undefined,
      ),
    );
    
    return result;
}

export const getAllProviders = async () => {
    return await db.select().from(providerTable);
}

export const getProviderById = async(id: number) => {
    const provider = await db.query.providerTable.findFirst({
        where: eq(providerTable.provider_id, id),
    });
    
    
    return provider;
}

export const addProvider = async ( newProvider: {
    name: string;
    phone_number: string;
    email?: string;
    address: string;
}) => {
    const result = await db
        .insert(providerTable)
        .values({
            ...newProvider,
        })
        .returning();

    return result;
}

export async function updateProvider(
    provider_id: number,
    provider_upd: {
        name?: string;
        phone_number?: string;
        email?: string;
        address?: string;
    },
){
    const result = await db
        .update(providerTable)
        .set(provider_upd)
        .where(eq(providerTable.provider_id, provider_id))
        .returning();

    if (result) {return true}
    else {return false}
}

export const deleteProvider = async (provider_id: number) => {
    const result = await db
        .delete(providerTable)
        .where(eq(providerTable.provider_id, provider_id))
        .returning();

    if (result.length > 0) {return true}
    else {return false}
}