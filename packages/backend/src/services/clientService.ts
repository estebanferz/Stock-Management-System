import { db } from "../../db/db";
import { clientTable, saleTable } from "../../db/schema";
import { eq, and, ilike, gt, sql } from "drizzle-orm";
import { clientUpdateDTO, type Currency } from "@server/db/types";
import { fmtMoney, isCurrency, normalizeShortString, round2 } from "@server/src/util/formattersBackend";
import { convert } from "./currencyService";

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

export const getDebts = async (tenantId: number, display: Currency, fx: any) => {
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

  return debts.map((c) => {
    const debtUsd = Number(c.debt ?? 0);
    const debtDisplay = convert(debtUsd, "USD", display, fx.ratesToARS);

    return {
      ...c,
      debt: fmtMoney(debtDisplay, display),
    };
  });
};

export const getTotalDebt = async (tenantId: number, display: Currency, fx: any) => {
  const rows = await db
    .select({
      total_debt_usd: sql<number>`COALESCE(SUM(${clientTable.debt}), 0)`,
    })
    .from(clientTable)
    .where(and(eq(clientTable.tenant_id, tenantId), eq(clientTable.is_deleted, false)));

  const totalUsd = Number(rows[0]?.total_debt_usd ?? 0);
  const totalDisplay = convert(totalUsd, "USD", display, fx.ratesToARS);

  return fmtMoney(totalDisplay, display);
};

export async function getClientOverviewMetrics(
  tenantId: number,
  opts: { limit?: number } | undefined,
  display: Currency,
  fx: any
) {
  const limit = Math.min(Math.max(Number(opts?.limit ?? 5), 1), 20);

  // 1) clientes con deuda (count)
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

  // 2) deuda total (USD fijo) -> convertir una vez
  const totalDebtRows = await db
    .select({
      total_debt_usd: sql<number>`COALESCE(SUM(${clientTable.debt}), 0)`,
    })
    .from(clientTable)
    .where(and(eq(clientTable.tenant_id, tenantId), eq(clientTable.is_deleted, false)));

  const totalDebtUsd = Number(totalDebtRows[0]?.total_debt_usd ?? 0);
  const total_debt = round2(convert(totalDebtUsd, "USD", display, fx.ratesToARS));

  // 3) top clientes por total gastado (multi-currency) -> convertir fila a fila
  // Traemos todas las ventas con cliente, y agregamos en JS
  const saleRows = await db
    .select({
      client_id: saleTable.client_id,
      client_name: clientTable.name,
      amount: sql<number>`COALESCE(${saleTable.total_amount}, 0)`,
      currency: saleTable.currency,
      datetime: saleTable.datetime,
    })
    .from(saleTable)
    .innerJoin(
      clientTable,
      and(
        eq(clientTable.client_id, saleTable.client_id),
        eq(clientTable.tenant_id, tenantId),
        eq(clientTable.is_deleted, false)
      )
    )
    .where(
      and(
        eq(saleTable.tenant_id, tenantId),
        eq(saleTable.is_deleted, false)
      )
    );

  // aggregate por cliente
  const byClient = new Map<
    number,
    {
      client_id: number;
      name: string;
      sales_count: number;
      total_spent_display: number;
      last_sale_dt: Date | null;
    }
  >();

  for (const r of saleRows) {
    const cid = Number(r.client_id);
    if (!Number.isFinite(cid)) continue;

    const amt = Number(r.amount ?? 0);
    if (!Number.isFinite(amt)) continue;

    const cur: Currency = isCurrency(r.currency) ? r.currency : "ARS";
    const spent = convert(amt, cur, display, fx.ratesToARS);

    const existing =
      byClient.get(cid) ??
      {
        client_id: cid,
        name: String(r.client_name ?? ""),
        sales_count: 0,
        total_spent_display: 0,
        last_sale_dt: null,
      };

    existing.sales_count += 1;
    existing.total_spent_display += spent;

    const dt = r.datetime ? new Date(r.datetime as any) : null;
    if (dt && (!existing.last_sale_dt || dt > existing.last_sale_dt)) existing.last_sale_dt = dt;

    byClient.set(cid, existing);
  }

  // ordenar por total gastado convertido y limitar
  const top_clients = [...byClient.values()]
    .map((c) => {
      const total = round2(c.total_spent_display);

      return {
        client_id: c.client_id,
        name: c.name,
        sales_count: c.sales_count,
        total_spent: total,
        total_spent_formatted: fmtMoney(total, display),
        last_sale_datetime: c.last_sale_dt
          ? c.last_sale_dt.toISOString()
          : null,
      };
    })
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, limit);

  return {
    clients_with_debt,
    total_debt: fmtMoney(total_debt, display),
    top_clients,
  };
}