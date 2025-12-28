import { db } from "@server/db/db";
import { providerTable } from "@server/db/schema.ts";
import { ilike, and, eq } from "drizzle-orm";
import { normalizeShortString, ilikeWordsNormalized } from "../util/formattersBackend";

export async function getProviderByFilter(
  userId: number,
  filters: {
    name?: string;
    email?: string;
    phone_number?: string;
    address?: string;
    is_deleted?: boolean;
  }
) {
  return await db
    .select()
    .from(providerTable)
    .where(
      and(
        eq(providerTable.user_id, userId), // ✅ multi-tenant

        filters.name ? ilike(providerTable.name, `%${filters.name}%`) : undefined,
        filters.email ? ilike(providerTable.email, `%${filters.email}%`) : undefined,
        filters.phone_number ? ilike(providerTable.phone_number, `%${filters.phone_number}%`) : undefined,
        filters.address ? ilikeWordsNormalized(providerTable.address, filters.address) : undefined,

        filters.is_deleted !== undefined ? eq(providerTable.is_deleted, filters.is_deleted) : undefined
      )
    )
    .orderBy(providerTable.provider_id);
}

export const getAllProviders = async (userId: number) => {
  return await db
    .select()
    .from(providerTable)
    .where(eq(providerTable.user_id, userId)) // ✅
    .orderBy(providerTable.provider_id);
};

export const getProviderById = async (userId: number, id: number) => {
  const provider = await db.query.providerTable.findFirst({
    where: and(
      eq(providerTable.user_id, userId), // ✅
      eq(providerTable.provider_id, id),
      eq(providerTable.is_deleted, false)
    ),
  });

  return provider;
};

export const addProvider = async (newProvider: {
  user_id: number; // ✅ requerido
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

  const result = await db.insert(providerTable).values(normalizedProvider).returning();
  return result;
};

export async function updateProvider(
  userId: number,
  provider_id: number,
  provider_upd: {
    name?: string;
    phone_number?: string;
    email?: string;
    address?: string;
  }
) {
  // opcional: normalizar si querés también en update (lo dejo igual a tu lógica original)
  const result = await db
    .update(providerTable)
    .set(provider_upd)
    .where(and(eq(providerTable.user_id, userId), eq(providerTable.provider_id, provider_id))) // ✅
    .returning();

  return result;
}

export async function softDeleteProvider(userId: number, id: number) {
  const result = await db
    .update(providerTable)
    .set({ is_deleted: true })
    .where(and(eq(providerTable.user_id, userId), eq(providerTable.provider_id, id))) // ✅
    .returning();

  return result.length > 0;
}
