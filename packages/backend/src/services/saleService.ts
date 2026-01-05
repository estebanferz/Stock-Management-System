import { db } from "@server/db/db";
import {
  saleTable,
  expenseTable,
  phoneTable,
  clientTable,
  sellerTable,
} from "@server/db/schema.ts";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { normalizeShortString } from "../util/formattersBackend";

// ---- tenant checks ----
async function assertTenantClient(tenantId: number, clientId: number) {
  const rows = await db
    .select({ id: clientTable.client_id, is_deleted: clientTable.is_deleted })
    .from(clientTable)
    .where(and(eq(clientTable.tenant_id, tenantId), eq(clientTable.client_id, clientId)))
    .limit(1);

  if (!rows[0] || rows[0].is_deleted) throw new Error("INVALID_CLIENT");
}

async function assertTenantSeller(tenantId: number, sellerId: number) {
  const rows = await db
    .select({ id: sellerTable.seller_id, is_deleted: sellerTable.is_deleted })
    .from(sellerTable)
    .where(and(eq(sellerTable.tenant_id, tenantId), eq(sellerTable.seller_id, sellerId)))
    .limit(1);

  if (!rows[0] || rows[0].is_deleted) throw new Error("INVALID_SELLER");
}

async function assertTenantDevice(tenantId: number, deviceId: number) {
  const rows = await db
    .select({ id: phoneTable.device_id, is_deleted: phoneTable.is_deleted })
    .from(phoneTable)
    .where(and(eq(phoneTable.tenant_id, tenantId), eq(phoneTable.device_id, deviceId)))
    .limit(1);

  if (!rows[0] || rows[0].is_deleted) throw new Error("INVALID_DEVICE");
}

async function assertTenantTradeIn(tenantId: number, deviceId: number) {
  const rows = await db
    .select({ id: phoneTable.device_id, is_deleted: phoneTable.is_deleted })
    .from(phoneTable)
    .where(and(eq(phoneTable.tenant_id, tenantId), eq(phoneTable.device_id, deviceId)))
    .limit(1);

  if (!rows[0] || rows[0].is_deleted) throw new Error("INVALID_TRADE_IN");
}

function toRoundedInt(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.round(v);
}

// ------------------ queries ------------------

export async function getSaleByFilter(
  tenantId: number,
  filters: {
    date?: string; // YYYY-MM-DD
    client_id?: string;
    seller_id?: string;
    device_id?: string;
    is_deleted?: boolean;
  }
) {
  return await db
    .select()
    .from(saleTable)
    .where(
      and(
        eq(saleTable.tenant_id, tenantId),

        filters.date ? eq(sql`date(${saleTable.datetime})`, filters.date) : undefined,
        filters.client_id ? eq(saleTable.client_id, Number(filters.client_id)) : undefined,
        filters.seller_id ? eq(saleTable.seller_id, Number(filters.seller_id)) : undefined,
        filters.device_id ? eq(saleTable.device_id, Number(filters.device_id)) : undefined,
        filters.is_deleted !== undefined ? eq(saleTable.is_deleted, filters.is_deleted) : undefined
      )
    )
    .orderBy(sql`${saleTable.datetime} DESC`);
}

export const getAllSales = async (tenantId: number) => {
  return await db
    .select()
    .from(saleTable)
    .where(eq(saleTable.tenant_id, tenantId))
    .orderBy(sql`${saleTable.datetime} DESC`);
};

export const getSaleById = async (tenantId: number, id: number) => {
  const sale = await db.query.saleTable.findFirst({
    where: and(eq(saleTable.tenant_id, tenantId), eq(saleTable.sale_id, id), eq(saleTable.is_deleted, false)),
  });
  return sale;
};

// ------------------ mutations ------------------

export const addSale = async (
  tenantId: number,
  newSale: {
    total_amount: string;
    payment_method: string;
    datetime?: Date;
    debt?: boolean;
    debt_amount?: string;
    client_id: number;
    seller_id: number;
    device_id: number;
    trade_in_device?: number;
  }
) => {
  // ✅ validate references belong to this tenant
  await assertTenantClient(tenantId, newSale.client_id);
  await assertTenantSeller(tenantId, newSale.seller_id);
  await assertTenantDevice(tenantId, newSale.device_id);
  if (newSale.trade_in_device !== undefined) {
    await assertTenantTradeIn(tenantId, newSale.trade_in_device);
  }

  const normalizedSale = {
    ...newSale,
    tenant_id: tenantId,
    payment_method: normalizeShortString(newSale.payment_method),
  };

  return await db.transaction(async (tx) => {
    // 1) Insert sale
    const inserted = await tx.insert(saleTable).values(normalizedSale).returning();

    // 2) Mark device as sold
    await tx
      .update(phoneTable)
      .set({ sold: true })
      .where(and(eq(phoneTable.tenant_id, tenantId), eq(phoneTable.device_id, newSale.device_id)));

    // 3) If debt, add to client debt
    const addDebt = newSale.debt && newSale.debt_amount ? toRoundedInt(newSale.debt_amount) : 0;
    if (addDebt !== 0) {
      const clientRows = await tx
        .select({ debt: clientTable.debt, is_deleted: clientTable.is_deleted })
        .from(clientTable)
        .where(and(eq(clientTable.tenant_id, tenantId), eq(clientTable.client_id, newSale.client_id)))
        .limit(1);

      const c = clientRows[0];
      if (!c || c.is_deleted) throw new Error("INVALID_CLIENT");

      await tx
        .update(clientTable)
        .set({ debt: Math.max(0, Number(c.debt) + addDebt) })
        .where(and(eq(clientTable.tenant_id, tenantId), eq(clientTable.client_id, newSale.client_id)));
    }

    return inserted;
  });
};

export async function updateSale(
  tenantId: number,
  sale_id: number,
  sale_upd: {
    total_amount?: string;
    payment_method?: string;
    debt?: boolean;
    debt_amount?: string;
    client_id?: number;
    seller_id?: number;
    device_id?: number;
    trade_in_device?: number;
    datetime?: Date;
  }
) {
  // Traemos la sale actual (para delta de debt y cambio de device)
  const currentRows = await db
    .select()
    .from(saleTable)
    .where(and(eq(saleTable.tenant_id, tenantId), eq(saleTable.sale_id, sale_id)))
    .limit(1);

  const current = currentRows[0];
  if (!current || current.is_deleted) throw new Error("SALE_NOT_FOUND");

  // ✅ validate references if present
  if (sale_upd.client_id !== undefined) await assertTenantClient(tenantId, sale_upd.client_id);
  if (sale_upd.seller_id !== undefined) await assertTenantSeller(tenantId, sale_upd.seller_id);
  if (sale_upd.device_id !== undefined) await assertTenantDevice(tenantId, sale_upd.device_id);
  if (sale_upd.trade_in_device !== undefined) await assertTenantTradeIn(tenantId, sale_upd.trade_in_device);

  const normalizedUpd = {
    ...sale_upd,
    payment_method: sale_upd.payment_method ? normalizeShortString(sale_upd.payment_method) : undefined,
  };

  // Deuda “antes” y “después”
  const prevDebt = current.debt && current.debt_amount ? toRoundedInt(current.debt_amount) : 0;

  const nextDebtFlag = sale_upd.debt ?? current.debt;
  const nextDebtAmount = sale_upd.debt_amount ?? current.debt_amount;
  const nextDebt = nextDebtFlag && nextDebtAmount ? toRoundedInt(nextDebtAmount) : 0;

  const prevClientId = current.client_id;
  const nextClientId = sale_upd.client_id ?? prevClientId;

  return await db.transaction(async (tx) => {
    // 1) Update sale scoped by tenant
    const updated = await tx
      .update(saleTable)
      .set(normalizedUpd)
      .where(and(eq(saleTable.tenant_id, tenantId), eq(saleTable.sale_id, sale_id)))
      .returning();

    // 2) If device changed: old sold=false, new sold=true
    if (sale_upd.device_id !== undefined && sale_upd.device_id !== current.device_id) {
      await tx
        .update(phoneTable)
        .set({ sold: false })
        .where(and(eq(phoneTable.tenant_id, tenantId), eq(phoneTable.device_id, current.device_id)));

      await tx
        .update(phoneTable)
        .set({ sold: true })
        .where(and(eq(phoneTable.tenant_id, tenantId), eq(phoneTable.device_id, sale_upd.device_id)));
    }

    // 3) Ajuste de deuda en client.debt (maneja también cambio de client)
    if (prevClientId === nextClientId) {
      const delta = nextDebt - prevDebt;
      if (delta !== 0) {
        const [c] = await tx
          .select({ debt: clientTable.debt, is_deleted: clientTable.is_deleted })
          .from(clientTable)
          .where(and(eq(clientTable.tenant_id, tenantId), eq(clientTable.client_id, nextClientId)))
          .limit(1);

        if (!c || c.is_deleted) throw new Error("INVALID_CLIENT");

        await tx
          .update(clientTable)
          .set({ debt: Math.max(0, Number(c.debt) + delta) })
          .where(and(eq(clientTable.tenant_id, tenantId), eq(clientTable.client_id, nextClientId)));
      }
    } else {
      // mover deuda del cliente anterior al nuevo
      if (prevDebt !== 0) {
        const [cPrev] = await tx
          .select({ debt: clientTable.debt, is_deleted: clientTable.is_deleted })
          .from(clientTable)
          .where(and(eq(clientTable.tenant_id, tenantId), eq(clientTable.client_id, prevClientId)))
          .limit(1);

        if (!cPrev || cPrev.is_deleted) throw new Error("INVALID_CLIENT");

        await tx
          .update(clientTable)
          .set({ debt: Math.max(0, Number(cPrev.debt) - prevDebt) })
          .where(and(eq(clientTable.tenant_id, tenantId), eq(clientTable.client_id, prevClientId)));
      }

      if (nextDebt !== 0) {
        const [cNext] = await tx
          .select({ debt: clientTable.debt, is_deleted: clientTable.is_deleted })
          .from(clientTable)
          .where(and(eq(clientTable.tenant_id, tenantId), eq(clientTable.client_id, nextClientId)))
          .limit(1);

        if (!cNext || cNext.is_deleted) throw new Error("INVALID_CLIENT");

        await tx
          .update(clientTable)
          .set({ debt: Math.max(0, Number(cNext.debt) + nextDebt) })
          .where(and(eq(clientTable.tenant_id, tenantId), eq(clientTable.client_id, nextClientId)));
      }
    }

    return updated;
  });
}

export async function softDeleteSale(tenantId: number, id: number) {
  return await db.transaction(async (tx) => {
    // get sale before delete (scoped)
    const saleRows = await tx
      .select()
      .from(saleTable)
      .where(and(eq(saleTable.tenant_id, tenantId), eq(saleTable.sale_id, id)));

    if (saleRows.length === 0) return false;

    const sale = saleRows[0];
    if (!sale || sale.is_deleted) return false;

    // softDelete sale
    await tx
      .update(saleTable)
      .set({ is_deleted: true })
      .where(and(eq(saleTable.tenant_id, tenantId), eq(saleTable.sale_id, id)));

    // update phone, sold: false (scoped)
    if (sale.device_id) {
      await tx
        .update(phoneTable)
        .set({ sold: false })
        .where(and(eq(phoneTable.tenant_id, tenantId), eq(phoneTable.device_id, sale.device_id)));
    }

    // if debt, update client's debt (scoped)
    const subtract = sale.debt && sale.debt_amount ? toRoundedInt(sale.debt_amount) : 0;
    if (subtract !== 0 && sale.client_id) {
      const [client] = await tx
        .select({ debt: clientTable.debt, is_deleted: clientTable.is_deleted })
        .from(clientTable)
        .where(and(eq(clientTable.tenant_id, tenantId), eq(clientTable.client_id, sale.client_id)))
        .limit(1);

      if (client && !client.is_deleted) {
        const newDebt = Math.max(0, Number(client.debt) - subtract);

        await tx
          .update(clientTable)
          .set({ debt: newDebt })
          .where(and(eq(clientTable.tenant_id, tenantId), eq(clientTable.client_id, sale.client_id)));
      }
    }

    return true;
  });
}

// ------------------ analytics ------------------

export const getGrossIncome = async (tenantId: number) => {
  const income = await db
    .select({
      gross_income: sql`SUM(${saleTable.total_amount})`,
    })
    .from(saleTable)
    .where(and(eq(saleTable.tenant_id, tenantId), eq(saleTable.is_deleted, false)));

  const debts = await db
    .select({
      total_debt: sql`SUM(${saleTable.debt_amount})`,
    })
    .from(saleTable)
    .where(and(eq(saleTable.tenant_id, tenantId), eq(saleTable.debt, true), eq(saleTable.is_deleted, false)));

  const gross = Number(income[0]?.gross_income) || 0;
  const debt = Number(debts[0]?.total_debt) || 0;

  return Number((gross - debt).toFixed(2));
};

export const getNetIncome = async (tenantId: number) => {
  const grossIncome = await getGrossIncome(tenantId);

  const expenseDebts = await db
    .select({
      total_expenses: sql`SUM(${expenseTable.amount})`,
    })
    .from(expenseTable)
    .where(and(eq(expenseTable.tenant_id, tenantId), eq(expenseTable.is_deleted, false)));

  const expenses = Number(expenseDebts[0]?.total_expenses) || 0;

  return Number((Number(grossIncome) - expenses).toFixed(2));
};

type SalesByMonthRow = {
  month_start_date: string;
  count: number;
};

export const getSalesByMonth = async (tenantId: number, year: number) => {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  const rows = await db
    .select({
      month_start_date: sql<string>`DATE_TRUNC('month', ${saleTable.datetime})`,
      count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
    })
    .from(saleTable)
    .where(
      and(
        eq(saleTable.tenant_id, tenantId),
        eq(saleTable.is_deleted, false),
        gte(saleTable.datetime, start),
        lt(saleTable.datetime, end)
      )
    )
    .groupBy(sql`DATE_TRUNC('month', ${saleTable.datetime})`)
    .orderBy(sql`DATE_TRUNC('month', ${saleTable.datetime}) ASC`);

  const countsByMonth = new Map<number, number>();
  for (const r of rows as SalesByMonthRow[]) {
    const d = new Date(r.month_start_date);
    const monthIndex = d.getUTCMonth();
    countsByMonth.set(monthIndex, Number(r.count) || 0);
  }

  return Array.from({ length: 12 }, (_, i) => {
    const monthStart = new Date(Date.UTC(year, i, 1));
    return {
      month_start_date: monthStart.toISOString(),
      count: countsByMonth.get(i) ?? 0,
    };
  });
};

export const getProductSoldCount = async (tenantId: number) => {
  const result = await db
    .select({
      name: phoneTable.name,
      sold_count: sql<number>`CAST(COUNT(${saleTable.device_id}) AS INTEGER)`,
    })
    .from(saleTable)
    .innerJoin(
      phoneTable,
      and(eq(saleTable.device_id, phoneTable.device_id), eq(phoneTable.tenant_id, tenantId))
    )
    .where(and(eq(saleTable.tenant_id, tenantId), eq(saleTable.is_deleted, false)))
    .groupBy(phoneTable.name)
    .orderBy(sql`COUNT(${saleTable.device_id}) DESC`)
    .limit(5);

  return result;
};

export const getDebts = async (tenantId: number) => {
  return await db
    .select()
    .from(saleTable)
    .where(and(eq(saleTable.tenant_id, tenantId), eq(saleTable.debt, true), eq(saleTable.is_deleted, false)));
};

export const getTotalDebt = async (tenantId: number) => {
  const debts = await db
    .select({
      total_debt: sql`SUM(${saleTable.debt_amount})`,
    })
    .from(saleTable)
    .where(and(eq(saleTable.tenant_id, tenantId), eq(saleTable.debt, true), eq(saleTable.is_deleted, false)));

  const total = Number(debts[0]?.total_debt) || 0;
  return total;
};
