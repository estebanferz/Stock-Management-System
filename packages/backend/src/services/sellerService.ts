import { db } from "@server/db/db";
import { sellerTable } from "@server/db/schema";
import { and, ilike, eq, sql, gte, lte } from "drizzle-orm";
import { normalizeShortString } from "../util/formattersBackend";

export const getSellersByFilter = async (
  tenantId: number,
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
        eq(sellerTable.tenant_id, tenantId),

        filters.name ? ilike(sellerTable.name, `%${filters.name}%`) : undefined,

        filters.hire_date
          ? eq(sql`date(${sellerTable.hire_date})`, filters.hire_date)
          : undefined,

        filters.pay_date
          ? eq(sql`date(${sellerTable.pay_date})`, filters.pay_date)
          : undefined,

        filters.age_min ? gte(sellerTable.age, Number(filters.age_min)) : undefined,
        filters.age_max ? lte(sellerTable.age, Number(filters.age_max)) : undefined,

        filters.commission_min
          ? gte(sellerTable.commission, filters.commission_min)
          : undefined,

        filters.commission_max
          ? lte(sellerTable.commission, filters.commission_max)
          : undefined,

        filters.is_deleted !== undefined
          ? eq(sellerTable.is_deleted, filters.is_deleted)
          : undefined
      )
    )
    .orderBy(sellerTable.seller_id);
};

export const getAllSellers = async (tenantId: number) => {
  return await db
    .select()
    .from(sellerTable)
    .where(eq(sellerTable.tenant_id, tenantId))
    .orderBy(sellerTable.seller_id);
};

export const getSellerById = async (tenantId: number, id: number) => {
  const seller = await db.query.sellerTable.findFirst({
    where: and(eq(sellerTable.tenant_id, tenantId), eq(sellerTable.seller_id, id)),
  });

  return seller;
};

export const addSeller = async (
  tenantId: number,
  newSeller: {
    tenant_id: number;
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
    tenant_id: tenantId, // ✅ force server-side
    name: normalizeShortString(newSeller.name),
    email: newSeller.email ? newSeller.email.trim().toLowerCase() : undefined,
    phone_number: newSeller.phone_number ? newSeller.phone_number.trim() : undefined,
  };

  return await db.insert(sellerTable).values(normalizedSeller).returning();
};

export const updateSeller = async (
  tenantId: number,
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
    email: seller_upd.email ? seller_upd.email.trim().toLowerCase() : undefined,
    phone_number: seller_upd.phone_number ? seller_upd.phone_number.trim() : undefined,
  };

  const result = await db
    .update(sellerTable)
    .set(normalizedUpd)
    .where(and(eq(sellerTable.tenant_id, tenantId), eq(sellerTable.seller_id, seller_id)))
    .returning();

  return result;
};

export async function softDeleteSeller(tenantId: number, id: number) {
  const result = await db
    .update(sellerTable)
    .set({ is_deleted: true })
    .where(and(eq(sellerTable.tenant_id, tenantId), eq(sellerTable.seller_id, id)))
    .returning();

  return result.length > 0;
}
