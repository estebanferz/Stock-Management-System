import { db } from "../../db/db";
import { clientTable } from "../../db/schema";
import { eq, and, ilike, gt, sql } from "drizzle-orm";
import { clientUpdateDTO } from "@server/db/types";
import { normalizeShortString } from "@server/src/util/formattersBackend";

export async function getClientByFilter(
  tenantId: number,
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
        eq(clientTable.tenant_id, tenantId),
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

export async function getAllClients(tenantId: number) {
  return await db
    .select()
    .from(clientTable)
    .where(eq(clientTable.tenant_id, tenantId))
    .orderBy(clientTable.client_id);
}

export const getClientById = async (tenantId: number, id: number) => {
  const client = await db.query.clientTable.findFirst({
    where: and(eq(clientTable.tenant_id, tenantId), eq(clientTable.client_id, id)),
  });
  return client;
};

export async function updateClient(
  tenantId: number,
  client_id: number,
  client_upd: typeof clientUpdateDTO.static
) {
  const normalizedClient = {
    ...client_upd,
    name: normalizeShortString(client_upd.name),
    email: client_upd.email?.toLowerCase().trim(),
  };
  const result = await db
    .update(clientTable)
    .set(normalizedClient)
    .where(and(eq(clientTable.tenant_id, tenantId), eq(clientTable.client_id, client_id)))
    .returning();

  return result;
}

export const addClient = async (newClient: {
  tenant_id: number;
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

export async function softDeleteClient(tenantId: number, id: number) {
  const result = await db
    .update(clientTable)
    .set({ is_deleted: true })
    .where(and(eq(clientTable.tenant_id, tenantId), eq(clientTable.client_id, id)))
    .returning();

  return result.length > 0;
}

export const getDebts = async (tenantId: number) => {
  const debts = await db
    .select()
    .from(clientTable)
    .where(
      and(
        eq(clientTable.tenant_id, tenantId),
        gt(clientTable.debt, 0),
        eq(clientTable.is_deleted, false)
      )
    );

  return debts;
};

export const getTotalDebt = async (tenantId: number) => {
  const debts = await db
    .select({
      total_debt: sql`SUM(${clientTable.debt})`,
    })
    .from(clientTable)
    .where(
      and(
        eq(clientTable.tenant_id, tenantId),
        eq(clientTable.is_deleted, false)
      )
    );

  const { total_debt } = debts[0] ?? { total_debt: 0 };
  return Number(total_debt ?? 0);
};
