import { db } from "@server/db/db";
import { providerTable } from "@server/db/schema.ts";
import { ilike, and, eq } from "drizzle-orm"
import { normalizeShortString } from "../util/formattersBackend";

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
    return await db.select().from(providerTable).where(eq(providerTable.is_deleted, false)).orderBy(providerTable.provider_id);
}

export const getProviderById = async(id: number) => {
    const provider = await db.query.providerTable.findFirst({
        where: and(
            eq(providerTable.provider_id, id),
            eq(providerTable.is_deleted, false)),
    });
    
    
    return provider;
}

export const addProvider = async ( newProvider: {
    name: string;
    phone_number: string;
    email?: string;
    address: string;
}) => {
    const normalizedProvider = {
        ...newProvider,
        name: normalizeShortString(newProvider.name),
        address: normalizeShortString(newProvider.address),
        phone_number: newProvider.phone_number.trim(),
        email: newProvider.email?.toLowerCase().trim(),
    };
    
    const result = await db
        .insert(providerTable)
        .values(normalizedProvider)
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

    return result;
}

export const deleteProvider = async (provider_id: number) => {
    const result = await db
        .delete(providerTable)
        .where(eq(providerTable.provider_id, provider_id))
        .returning();

    if (result.length > 0) {return true}
    else {return false}
}