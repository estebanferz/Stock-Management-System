import { db } from "@server/db/db"
import { sellerTable } from "@server/db/schema"
import { and, ilike, eq, sql, gte, lte } from "drizzle-orm"
import { normalizeShortString } from "../util/formattersBackend";


export const getSellersByFilter = async (filters: {
  name?: string;
  hire_date?: string;
  pay_date?: string;
  age_min?: string;
  age_max?: string;
  commission_min?: string;
  commission_max?: string;
  is_deleted?: boolean;
}) => {
  return await db
    .select()
    .from(sellerTable)
    .where(
      and(
        filters.name
          ? ilike(sellerTable.name, `%${filters.name}%`)
          : undefined,

        filters.hire_date
          ? eq(sql`date(${sellerTable.hire_date})`, filters.hire_date)
          : undefined,

        filters.pay_date
          ? eq(sql`date(${sellerTable.pay_date})`, filters.pay_date)
          : undefined,

        filters.age_min
          ? gte(sellerTable.age, Number(filters.age_min))
          : undefined,

        filters.age_max
          ? lte(sellerTable.age, Number(filters.age_max))
          : undefined,

        filters.commission_min
          ? gte(sellerTable.commission, filters.commission_min)
          : undefined,

        filters.commission_max
          ? lte(sellerTable.commission, filters.commission_max)
          : undefined,

        filters.is_deleted !== undefined
          ? eq(sellerTable.is_deleted, filters.is_deleted)
          : undefined,
      ),
    )
    .orderBy(sellerTable.seller_id);
};


export const getAllSellers = async () => {
    return await db.select().from(sellerTable).orderBy(sellerTable.seller_id);
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