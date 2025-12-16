import { db } from "@server/db/db"
import { sellerTable } from "@server/db/schema"
import { and, ilike, eq, sql } from "drizzle-orm"
import { dateToYMD, normalizeShortString } from "../util/formattersBackend";


export const getSellersByFilter = async (
    name?: string,
    hire_date?: string,
    pay_date?: string,
) => {
    const result = await db
        .select()
        .from(sellerTable)
        .where(
            and(
                name? ilike(sellerTable.name, `%${name}%`) : undefined,
                hire_date? eq(sql`date(${sellerTable.hire_date})`, hire_date) : undefined,
                pay_date? eq(sql`date(${sellerTable.pay_date})`, pay_date) : undefined,
                eq(sellerTable.is_deleted, false),
            )
        );
        
        return result;
}

export const getAllSellers = async () => {
    return await db.select().from(sellerTable).where(eq(sellerTable.is_deleted, false)).orderBy(sellerTable.seller_id);
}

export const getSellerById = async(id: number) => {
    const seller = await db.query.sellerTable.findFirst({
        where: eq(sellerTable.seller_id, id),
    });
    
    return seller;
}

export const addSeller = async (
    newSeller: {
        name: string;
        age: number;
        email?: string;
        phone_number?: string;
        hire_date?: string;
        pay_date?: string;
        commission?: string;
    }
) => {
    const normalizedSeller = {
        ...newSeller,
        name: normalizeShortString(newSeller.name),
        email: newSeller.email?.trim(),
        phone_number: newSeller.phone_number?.trim(),
    };

    const result = await db
        .insert(sellerTable)
        .values(normalizedSeller)
        .returning();

    return result;
}

export const updateSeller = async (
    seller_id: number,
    seller_upd: {
        name?: string,
        age?: number,
        email?: string,
        phone_number?: string,
        pay_date?: string,
        hire_date?: string,
        commission?: string,
    }
) => {
    const result = await db
        .update(sellerTable)
        .set(seller_upd)
        .where(
            eq(sellerTable.seller_id, seller_id)
        )
        .returning();

    return result;
}

export async function softDeleteSeller(id: number) {
    const result = await db
        .update(sellerTable)
        .set({ is_deleted: true })
        .where(eq(sellerTable.seller_id, id))
        .returning();

    return result.length > 0;
}