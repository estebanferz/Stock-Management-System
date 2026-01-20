import { db } from "../../db/db";
import { clientTable, saleTable } from "../../db/schema";
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
    )
    .orderBy(sql`${clientTable.debt} DESC`);

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

export async function getClientOverviewMetrics(
  tenantId: number,
  opts?: { limit?: number }
) {
  const limit = Math.min(Math.max(Number(opts?.limit ?? 5), 1), 20);

  // 1) clientes con deuda
  const debtCountRows = await db
    .select({
      clients_with_debt: sql<number>`CAST(COUNT(*) AS INTEGER)`,
    })
    .from(clientTable)
    .where(
      and(
        eq(clientTable.tenant_id, tenantId),
        eq(clientTable.is_deleted, false),
        gt(clientTable.debt, 0)
      )
    );

  const clients_with_debt = Number(debtCountRows[0]?.clients_with_debt ?? 0);

  // 2) deuda total
  const totalDebtRows = await db
    .select({
      total_debt: sql<string>`COALESCE(SUM(${clientTable.debt}), 0)::text`,
    })
    .from(clientTable)
    .where(
      and(
        eq(clientTable.tenant_id, tenantId),
        eq(clientTable.is_deleted, false)
      )
    );

  const total_debt = Number(totalDebtRows[0]?.total_debt ?? 0);

  // 3) top clientes por total gastado (ventas)
  const topRows = await db
    .select({
      client_id: clientTable.client_id,
      name: clientTable.name,
      sales_count: sql<number>`CAST(COUNT(${saleTable.sale_id}) AS INTEGER)`,
      total_spent: sql<string>`COALESCE(SUM(${saleTable.total_amount}), 0)::text`,
      last_sale_datetime: sql<string>`MAX(${saleTable.datetime})::text`,
    })
    .from(clientTable)
    .innerJoin(
      saleTable,
      and(
        eq(saleTable.client_id, clientTable.client_id),
        eq(saleTable.tenant_id, tenantId),
        eq(saleTable.is_deleted, false)
      )
    )
    .where(
      and(
        eq(clientTable.tenant_id, tenantId),
        eq(clientTable.is_deleted, false)
      )
    )
    .groupBy(clientTable.client_id, clientTable.name)
    .orderBy(sql`COALESCE(SUM(${saleTable.total_amount}), 0) DESC`)
    .limit(limit);

  const top_clients = topRows.map((r) => ({
    client_id: Number(r.client_id),
    name: String(r.name ?? ""),
    sales_count: Number(r.sales_count ?? 0),
    total_spent: Number(Number(r.total_spent ?? 0).toFixed(2)),
    last_sale_datetime: r.last_sale_datetime ? new Date(r.last_sale_datetime).toISOString() : null,
  }));

  return {
    clients_with_debt,
    total_debt: Number(total_debt.toFixed(2)),
    top_clients,
  };
}

