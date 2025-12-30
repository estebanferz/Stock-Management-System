import { db } from "../../db/db";
import { clientTable } from "../../db/schema";
import { eq, and, ilike, gt, sql } from "drizzle-orm";
import { clientUpdateDTO } from "@server/db/types";
import { normalizeShortString } from "@server/src/util/formattersBackend";

export async function getClientByFilter(
  userId: number,
  name?: string,
  id_number?: string,
  email?: string,
  phone_number?: string,
  is_deleted?: boolean
) {
  const result = await db
    .select()
    .from(clientTable)
    .where(
      and(
        eq(clientTable.user_id, userId), // ✅ multi-tenant siempre
        name ? ilike(clientTable.name, `%${name}%`) : undefined,
        id_number ? eq(clientTable.id_number, Number(id_number)) : undefined,
        email ? ilike(clientTable.email, `%${email}%`) : undefined,
        phone_number ? ilike(clientTable.phone_number, `%${phone_number}%`) : undefined,
        is_deleted !== undefined ? eq(clientTable.is_deleted, is_deleted) : undefined
      )
    )
    .orderBy(clientTable.client_id);

  return result;
}

export async function getAllClients(userId: number) {
  return await db
    .select()
    .from(clientTable)
    .where(eq(clientTable.user_id, userId))
    .orderBy(clientTable.client_id);
}

export const getClientById = async (userId: number, id: number) => {
  const client = await db.query.clientTable.findFirst({
    where: and(eq(clientTable.user_id, userId), eq(clientTable.client_id, id)), // ✅
  });
  return client;
};

export async function updateClient(
  userId: number,
  client_id: number,
  client_upd: typeof clientUpdateDTO.static
) {
  const result = await db
    .update(clientTable)
    .set(client_upd)
    .where(and(eq(clientTable.user_id, userId), eq(clientTable.client_id, client_id))) // ✅
    .returning();

  return result;
}

export const addClient = async (newClient: {
  user_id: number;
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
};

export async function softDeleteClient(userId: number, id: number) {
  const result = await db
    .update(clientTable)
    .set({ is_deleted: true })
    .where(and(eq(clientTable.user_id, userId), eq(clientTable.client_id, id))) // ✅
    .returning();

  return result.length > 0;
}

export const getDebts = async (userId: number) => {
  const debts = await db
    .select()
    .from(clientTable)
    .where(
      and(
        eq(clientTable.user_id, userId), // ✅
        gt(clientTable.debt, 0),
        eq(clientTable.is_deleted, false)
      )
    );

  return debts;
};

export const getTotalDebt = async (userId: number) => {
  const debts = await db
    .select({
      total_debt: sql`SUM(${clientTable.debt})`,
    })
    .from(clientTable)
    .where(
      and(
        eq(clientTable.user_id, userId), // ✅
        eq(clientTable.is_deleted, false)
      )
    );

  const { total_debt } = debts[0] ?? { total_debt: 0 };
  return Number(total_debt ?? 0);
};
