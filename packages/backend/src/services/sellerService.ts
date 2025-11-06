import { db } from "@server/db/db"
import { sellerTable } from "@server/db/schema"
import { and, ilike, eq, sql } from "drizzle-orm"


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
            )
        );
        
        return result;
}

export const getAllSellers = async () => {
    return await db.select().from(sellerTable);
}

export const addSeller = async (
    newSeller: {
        name: string;
        age: number;
        email?: string;
        phone_number?: string;
        pay_date?: string;
    }
) => {
    const result = await db
        .insert(sellerTable)
        .values({
            ...newSeller,
        })
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

export const deleteSeller = async (
    seller_id: number
) => {
    const result = await db
        .delete(sellerTable)
        .where(
            eq(sellerTable.seller_id, seller_id)
        )
        .returning();

    return result;
}