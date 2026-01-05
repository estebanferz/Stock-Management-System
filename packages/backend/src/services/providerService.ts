import { db } from "@server/db/db";
import { providerTable } from "@server/db/schema.ts";
import { ilike, and, eq } from "drizzle-orm";
import { normalizeShortString, ilikeWordsNormalized } from "../util/formattersBackend";

export async function getProviderByFilter(
  tenantId: number,
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
        eq(providerTable.tenant_id, tenantId),

        filters.name ? ilike(providerTable.name, `%${filters.name}%`) : undefined,
        filters.email ? ilike(providerTable.email, `%${filters.email}%`) : undefined,
        filters.phone_number
          ? ilike(providerTable.phone_number, `%${filters.phone_number}%`)
          : undefined,
        filters.address ? ilikeWordsNormalized(providerTable.address, filters.address) : undefined,

        filters.is_deleted !== undefined ? eq(providerTable.is_deleted, filters.is_deleted) : undefined
      )
    )
    .orderBy(providerTable.provider_id);
}

export const getAllProviders = async (tenantId: number) => {
  return await db
    .select()
    .from(providerTable)
    .where(eq(providerTable.tenant_id, tenantId))
    .orderBy(providerTable.provider_id);
};

export const getProviderById = async (tenantId: number, id: number) => {
  const provider = await db.query.providerTable.findFirst({
    where: and(
      eq(providerTable.tenant_id, tenantId),
      eq(providerTable.provider_id, id),
      eq(providerTable.is_deleted, false)
    ),
  });

  return provider;
};

export const addProvider = async (newProvider: {
  tenant_id: number;
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

  return await db.insert(providerTable).values(normalizedProvider).returning();
};

export async function updateProvider(
  tenantId: number,
  provider_id: number,
  provider_upd: {
    name?: string;
    phone_number?: string;
    email?: string;
    address?: string;
  }
) {
  const normalized = {
    ...provider_upd,
    name: provider_upd.name ? normalizeShortString(provider_upd.name) : undefined,
    address: provider_upd.address ? normalizeShortString(provider_upd.address) : undefined,
    phone_number: provider_upd.phone_number ? provider_upd.phone_number.trim() : undefined,
    email: provider_upd.email ? provider_upd.email.toLowerCase().trim() : undefined,
  };

  const result = await db
    .update(providerTable)
    .set(normalized)
    .where(and(eq(providerTable.tenant_id, tenantId), eq(providerTable.provider_id, provider_id)))
    .returning();

  return result;
}

export async function softDeleteProvider(tenantId: number, id: number) {
  const result = await db
    .update(providerTable)
    .set({ is_deleted: true })
    .where(and(eq(providerTable.tenant_id, tenantId), eq(providerTable.provider_id, id)))
    .returning();

  return result.length > 0;
}