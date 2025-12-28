import { db } from "@server/db/db";
import { sellerTable } from "@server/db/schema";
import { and, ilike, eq, sql, gte, lte } from "drizzle-orm";
import { normalizeShortString } from "../util/formattersBackend";

export const getSellersByFilter = async (
  userId: number,
  filters: {
    name?: string;
    hire_date?: string;
    pay_date?: string;
    age_min?: string;
    age_max?: string;
    commission_min?: string;
    commission_max?: string;
    is_deleted?: boolean;
  }
) => {
  return await db
    .select()
    .from(sellerTable)
    .where(
      and(
        eq(sellerTable.user_id, userId), // ✅ multi-tenant

        filters.name ? ilike(sellerTable.name, `%${filters.name}%`) : undefined,

        filters.hire_date ? eq(sql`date(${sellerTable.hire_date})`, filters.hire_date) : undefined,

        filters.pay_date ? eq(sql`date(${sellerTable.pay_date})`, filters.pay_date) : undefined,

        filters.age_min ? gte(sellerTable.age, Number(filters.age_min)) : undefined,

        filters.age_max ? lte(sellerTable.age, Number(filters.age_max)) : undefined,

        filters.commission_min ? gte(sellerTable.commission, filters.commission_min) : undefined,

        filters.commission_max ? lte(sellerTable.commission, filters.commission_max) : undefined,

        filters.is_deleted !== undefined ? eq(sellerTable.is_deleted, filters.is_deleted) : undefined
      )
    )
    .orderBy(sellerTable.seller_id);
};

export const getAllSellers = async (userId: number) => {
  return await db
    .select()
    .from(sellerTable)
    .where(eq(sellerTable.user_id, userId)) // ✅
    .orderBy(sellerTable.seller_id);
};

export const getSellerById = async (userId: number, id: number) => {
  const seller = await db.query.sellerTable.findFirst({
    where: and(eq(sellerTable.user_id, userId), eq(sellerTable.seller_id, id)), // ✅
  });

  return seller;
};

export const addSeller = async (
  userId: number,
  newSeller: {
    user_id: number; // viene desde controller pero lo forzamos igual
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
    user_id: userId, // ✅ force server-side
    name: normalizeShortString(newSeller.name),
    email: newSeller.email?.trim(),
    phone_number: newSeller.phone_number?.trim(),
  };

  const result = await db.insert(sellerTable).values(normalizedSeller).returning();
  return result;
};

export const updateSeller = async (
  userId: number,
  seller_id: number,
  seller_upd: {
    name?: string;
    age?: number;
    email?: string;
    phone_number?: string;
    pay_date?: string;
    hire_date?: string;
    commission?: string;
  }
) => {
  const normalizedUpd = {
    ...seller_upd,
    name: seller_upd.name ? normalizeShortString(seller_upd.name) : undefined,
    email: seller_upd.email ? seller_upd.email.trim() : undefined,
    phone_number: seller_upd.phone_number ? seller_upd.phone_number.trim() : undefined,
  };

  const result = await db
    .update(sellerTable)
    .set(normalizedUpd)
    .where(and(eq(sellerTable.user_id, userId), eq(sellerTable.seller_id, seller_id))) // ✅
    .returning();

  return result;
};

export async function softDeleteSeller(userId: number, id: number) {
  const result = await db
    .update(sellerTable)
    .set({ is_deleted: true })
    .where(and(eq(sellerTable.user_id, userId), eq(sellerTable.seller_id, id))) // ✅
    .returning();

  return result.length > 0;
}
