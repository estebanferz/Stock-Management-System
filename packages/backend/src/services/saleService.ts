import { db } from "@server/db/db";
import {
  saleTable,
  expenseTable,
  phoneTable,
  clientTable,
  sellerTable,
  saleGiftAccessoryTable,
  accessoryTable,
} from "@server/db/schema.ts";
import { and, eq, gte, inArray, lt, lte, sql } from "drizzle-orm";
import { fmtMoney, isCurrency, normalizeShortString, round2 } from "../util/formattersBackend";
import { convert, type Currency } from "./currencyService";

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

async function getSellerCommissionPct(tx: any, tenantId: number, sellerId: number) {
  const rows = await tx
    .select({
      commission: sql<string>`COALESCE(${sellerTable.commission}, '0.00')::text`,
      is_deleted: sellerTable.is_deleted,
    })
    .from(sellerTable)
    .where(and(eq(sellerTable.tenant_id, tenantId), eq(sellerTable.seller_id, sellerId)))
    .limit(1);

  const r = rows[0];
  if (!r || r.is_deleted) throw new Error("INVALID_SELLER");
  return Number(r.commission ?? 0); // porcentaje (ej: 5.00)
}

const generalStringFormat = (v: string) => {
  if (!v) return "";
  const parts = v.split("-");

  const formattedParts = parts.map((p) => {
    if (!p) return "";
    let word = p.charAt(0).toUpperCase() + p.slice(1);

    if (word === "Iphone") {
      word = "iPhone";
    }

    return word;
  });

  return formattedParts.join(" ");
};

async function upsertCommissionExpense(
  tx: any,
  tenantId: number,
  saleId: number,
  datetime: Date | undefined,
  paymentMethod: string,
  currency: string,
  sellerId: number,
  saleTotalAmount: string
) {
  const pct = await getSellerCommissionPct(tx, tenantId, sellerId);
  const seller_data = await db.select().from(sellerTable).where(and(eq(sellerTable.tenant_id, tenantId), eq(sellerTable.seller_id, sellerId))).limit(1);
  const seller = seller_data[0];

  if (!seller) throw new Error("INVALID_SELLER");
  const total = Number(saleTotalAmount ?? 0);
  const amount = Number(((total * pct) / 100).toFixed(2));

  const description = `Comisión vendedor ${generalStringFormat(seller.name)} (${pct.toFixed(2)}%)`;

  // buscamos expense existente por sale_id + category
  const existing = await tx
    .select({ expense_id: expenseTable.expense_id })
    .from(expenseTable)
    .where(
      and(
        eq(expenseTable.tenant_id, tenantId),
        eq(expenseTable.is_deleted, false),
        eq(expenseTable.category, "Comisiones"),
        eq(expenseTable.sale_id, saleId)
      )
    )
    .limit(1);

  // si comisión da 0 → soft delete si existía
  if (amount <= 0) {
    if (existing[0]?.expense_id) {
      await tx
        .update(expenseTable)
        .set({ is_deleted: true })
        .where(and(eq(expenseTable.tenant_id, tenantId), eq(expenseTable.expense_id, existing[0].expense_id)));
    }
    return;
  }

  if (existing[0]?.expense_id) {
    await tx
      .update(expenseTable)
      .set({
        datetime: datetime ?? new Date(),
        amount: String(amount),
        payment_method: paymentMethod,
        description,
      })
      .where(and(eq(expenseTable.tenant_id, tenantId), eq(expenseTable.expense_id, existing[0].expense_id)));
    return;
  }

  await tx.insert(expenseTable).values({
    tenant_id: tenantId,
    sale_id: saleId,
    datetime: datetime ?? new Date(),
    category: "Comisiones",
    description,
    amount: String(amount),
    payment_method: paymentMethod,
    currency: currency,
    receipt_number: null,
    provider_id: null,
    is_deleted: false,
  });
}

async function softDeleteExpensesBySale(
  tx: any,
  tenantId: number,
  saleId: number
) {
  await tx
    .update(expenseTable)
    .set({ is_deleted: true })
    .where(
      and(
        eq(expenseTable.tenant_id, tenantId),
        eq(expenseTable.sale_id, saleId),
        eq(expenseTable.is_deleted, false)
      )
    );
}

// ------------------ gifts helpers ------------------

type GiftLine = { accessory_id: number; qty: number };

type AccessoryRow = {
  accessory_id: number;
  name: string;
  brand: string;
  stock: number;
  price: string;     // numeric -> string
  buy_cost: string;  // numeric -> string
};

export async function applyGiftStockAndBridgeInsert(
  tx: any,
  tenantId: number,
  saleId: number,
  giftLines: GiftLine[]
): Promise<{ giftExpenseTotal: number; giftDescription: string }> {
  if (!giftLines.length) {
    return { giftExpenseTotal: 0, giftDescription: "" };
  }

  // 🔒 Normalizar y agrupar por accessory_id (por si te vienen repetidos)
  const grouped = new Map<number, number>();
  for (const g of giftLines) {
    if (!g?.accessory_id) continue;
    const qty = Math.max(1, Number(g.qty || 1));
    grouped.set(g.accessory_id, (grouped.get(g.accessory_id) ?? 0) + qty);
  }
  const cleanLines: GiftLine[] = Array.from(grouped.entries()).map(([accessory_id, qty]) => ({
    accessory_id,
    qty,
  }));

  const ids = cleanLines.map((g) => g.accessory_id);

  // ✅ Tipar select para que TS conozca stock/brand/name/price/buy_cost
  const accessories: AccessoryRow[] = await tx
    .select({
      accessory_id: accessoryTable.accessory_id,
      name: accessoryTable.name,
      brand: accessoryTable.brand,
      stock: accessoryTable.stock,
      price: sql<string>`(${accessoryTable.price})::text`,
      buy_cost: sql<string>`(${accessoryTable.buy_cost})::text`,
    })
    .from(accessoryTable)
    .where(
      and(
        eq(accessoryTable.tenant_id, tenantId),
        inArray(accessoryTable.accessory_id, ids),
        eq(accessoryTable.is_deleted, false)
      )
    );

  const byId = new Map<number, AccessoryRow>(accessories.map((a) => [a.accessory_id, a]));

  // ✅ Validación de existencia + stock
  for (const line of cleanLines) {
    const a = byId.get(line.accessory_id);
    if (!a) throw new Error("ACCESSORY_NOT_FOUND");
    if (line.qty > a.stock) throw new Error("INSUFFICIENT_STOCK");
  }

  let total = 0;
  const parts: string[] = [];

  for (const line of cleanLines) {
    const a = byId.get(line.accessory_id)!;

    // 1) descontar stock
    await tx
      .update(accessoryTable)
      .set({ stock: sql`${accessoryTable.stock} - ${line.qty}` })
      .where(
        and(
          eq(accessoryTable.tenant_id, tenantId),
          eq(accessoryTable.accessory_id, line.accessory_id),
          eq(accessoryTable.is_deleted, false)
        )
      );

    // 2) upsert tabla puente (uniq por sale_id + accessory_id)
    await tx
      .insert(saleGiftAccessoryTable)
      .values({
        tenant_id: tenantId,
        sale_id: saleId,
        accessory_id: line.accessory_id,
        qty: line.qty,
        unit_price: a.price,
        unit_buy_cost: a.buy_cost,
        is_deleted: false,
      })
      .onConflictDoUpdate({
        target: [saleGiftAccessoryTable.sale_id, saleGiftAccessoryTable.accessory_id],
        set: {
          qty: line.qty,
          unit_price: a.price,
          unit_buy_cost: a.buy_cost,
          is_deleted: false,
        },
      });

    // 3) total gasto regalo (según lo que venías pidiendo: usando price)
    const priceNum = Number(a.price ?? 0);
    total += priceNum * line.qty;

    parts.push(`${line.qty}x ${a.brand} ${a.name}`.trim());
  }

  const giftDescription = `Regalo accesorios: ${parts.join(", ")}`;

  return {
    giftExpenseTotal: Number(total.toFixed(2)),
    giftDescription,
  };
}



async function upsertGiftExpense(
  tx: any,
  tenantId: number,
  saleId: number,
  datetime: Date | undefined,
  paymentMethod: string,
  currency: string,
  amount: number,
  description: string
) {
  const existing = await tx
    .select({ expense_id: expenseTable.expense_id })
    .from(expenseTable)
    .where(
      and(
        eq(expenseTable.tenant_id, tenantId),
        eq(expenseTable.is_deleted, false),
        eq(expenseTable.category, "Regalos"),
        eq(expenseTable.sale_id, saleId)
      )
    )
    .limit(1);

  if (amount <= 0) {
    if (existing[0]?.expense_id) {
      await tx
        .update(expenseTable)
        .set({ is_deleted: true })
        .where(
          and(
            eq(expenseTable.tenant_id, tenantId),
            eq(expenseTable.expense_id, existing[0].expense_id)
          )
        );
    }
    return;
  }

  if (existing[0]?.expense_id) {
    await tx
      .update(expenseTable)
      .set({
        datetime: datetime ?? new Date(),
        amount: String(amount),
        payment_method: paymentMethod,
        currency: currency,
        description,
      })
      .where(
        and(
          eq(expenseTable.tenant_id, tenantId),
          eq(expenseTable.expense_id, existing[0].expense_id)
        )
      );
    return;
  }

  await tx.insert(expenseTable).values({
    tenant_id: tenantId,
    sale_id: saleId,
    datetime: datetime ?? new Date(),
    category: "Regalos",
    description,
    amount: String(amount),
    payment_method: paymentMethod,
    currency: currency,
    receipt_number: null,
    provider_id: null,
    is_deleted: false,
  });
}


async function revertExistingGiftsToStockAndDeleteBridge(tx: any, tenantId: number, saleId: number) {
  const existing = await tx
    .select({
      accessory_id: saleGiftAccessoryTable.accessory_id,
      qty: saleGiftAccessoryTable.qty,
      is_deleted: saleGiftAccessoryTable.is_deleted,
    })
    .from(saleGiftAccessoryTable)
    .where(
      and(
        eq(saleGiftAccessoryTable.tenant_id, tenantId),
        eq(saleGiftAccessoryTable.sale_id, saleId),
        eq(saleGiftAccessoryTable.is_deleted, false)
      )
    );

  for (const line of existing) {
    await tx
      .update(accessoryTable)
      .set({ stock: sql`${accessoryTable.stock} + ${line.qty}` })
      .where(
        and(
          eq(accessoryTable.tenant_id, tenantId),
          eq(accessoryTable.accessory_id, line.accessory_id),
          eq(accessoryTable.is_deleted, false)
        )
      );
  }

  // soft delete bridge rows (así queda historial si querés)
  await tx
    .update(saleGiftAccessoryTable)
    .set({ is_deleted: true })
    .where(
      and(
        eq(saleGiftAccessoryTable.tenant_id, tenantId),
        eq(saleGiftAccessoryTable.sale_id, saleId),
        eq(saleGiftAccessoryTable.is_deleted, false)
      )
    );
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
    currency: string;
    payment_method: string;
    datetime?: Date;
    debt?: boolean;
    debt_amount?: string;
    client_id: number;
    seller_id: number;
    device_id: number;
    trade_in_device?: number;
    trade_in_phone?: any;
    gift_accessories?: { accessory_id: number; qty: number }[];
  }
) => {
  await assertTenantClient(tenantId, newSale.client_id);
  await assertTenantSeller(tenantId, newSale.seller_id);
  await assertTenantDevice(tenantId, newSale.device_id);
  if (newSale.trade_in_device !== undefined) {
    await assertTenantTradeIn(tenantId, newSale.trade_in_device);
  }

  const giftLines = newSale.gift_accessories ?? [];
  
  const { gift_accessories, trade_in_phone, trade_in_device, ...saleOnly } = newSale;

  const normalizedSale = {
    ...saleOnly,
    tenant_id: tenantId,
    payment_method: normalizeShortString(newSale.payment_method),
  };

  return await db.transaction(async (tx) => {
    let tradeInId: number | null = trade_in_device ?? null;
    if (!tradeInId && trade_in_phone) {
      console.log(trade_in_phone)
      const values = {
        ...trade_in_phone,
        tenant_id: tenantId,
        trade_in: true,
        sold: false,
        brand: normalizeShortString(trade_in_phone.brand),
        name: normalizeShortString(trade_in_phone.name),
        device_type: normalizeShortString(trade_in_phone.device_type),
        color: trade_in_phone.color ? normalizeShortString(trade_in_phone.color) : trade_in_phone.color,
        category: trade_in_phone.category ? normalizeShortString(trade_in_phone.category) : trade_in_phone.category,
        imei: trade_in_phone.imei.trim(),
      };

      const insertedTradeIn = await tx
        .insert(phoneTable)
        .values(values)
        .returning({ device_id: phoneTable.device_id });

      tradeInId = insertedTradeIn[0]?.device_id ?? null;
      if (!tradeInId) throw new Error("TRADE_IN_CREATE_FAILED");
    }

    // 1) Insert sale (sin gift_accessories)
    const inserted = await tx
      .insert(saleTable)
      .values({
        ...normalizedSale,
        trade_in_device: tradeInId,
      })
      .returning();

    const saleId = inserted[0]?.sale_id;
    if (!saleId) throw new Error("SALE_NOT_FOUND");

    // 2) Mark device as sold
    await tx
      .update(phoneTable)
      .set({ sold: true })
      .where(
        and(
          eq(phoneTable.tenant_id, tenantId),
          eq(phoneTable.device_id, newSale.device_id)
        )
      );

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

    await upsertCommissionExpense(
      tx,
      tenantId,
      saleId,
      normalizedSale.datetime,
      normalizedSale.payment_method,
      normalizedSale.currency,
      newSale.seller_id,
      newSale.total_amount
    );

    const giftLines = newSale.gift_accessories ?? [];

    const { giftExpenseTotal, giftDescription } =
      await applyGiftStockAndBridgeInsert(tx, tenantId, saleId, giftLines);

    await upsertGiftExpense(
      tx,
      tenantId,
      saleId,
      normalizedSale.datetime,
      normalizedSale.payment_method,
      normalizedSale.currency,
      giftExpenseTotal,
      giftDescription
    );

    return inserted;
  });
};


export async function updateSale(
  tenantId: number,
  sale_id: number,
  sale_upd: {
    total_amount?: string;
    currency?: string;
    payment_method?: string;
    debt?: boolean;
    debt_amount?: string;
    client_id?: number;
    seller_id?: number;
    device_id?: number;
    trade_in_device?: number;
    datetime?: Date;
    gift_accessories?: { accessory_id: number; qty: number }[];
  }
) {
  const currentRows = await db
    .select()
    .from(saleTable)
    .where(and(eq(saleTable.tenant_id, tenantId), eq(saleTable.sale_id, sale_id)))
    .limit(1);

  const current = currentRows[0];
  if (!current || current.is_deleted) throw new Error("SALE_NOT_FOUND");

  if (sale_upd.client_id !== undefined) await assertTenantClient(tenantId, sale_upd.client_id);
  if (sale_upd.seller_id !== undefined) await assertTenantSeller(tenantId, sale_upd.seller_id);
  if (sale_upd.device_id !== undefined) await assertTenantDevice(tenantId, sale_upd.device_id);
  if (sale_upd.trade_in_device !== undefined) await assertTenantTradeIn(tenantId, sale_upd.trade_in_device);

  // ✅ separar gifts del update del sale
  const giftLines = sale_upd.gift_accessories; // puede ser undefined (no tocar)
  const { gift_accessories, ...saleOnlyUpd } = sale_upd;

  const normalizedUpd = {
    ...saleOnlyUpd,
    payment_method: saleOnlyUpd.payment_method
      ? normalizeShortString(saleOnlyUpd.payment_method)
      : undefined,
  };

  const prevDebt = current.debt && current.debt_amount ? toRoundedInt(current.debt_amount) : 0;

  const nextDebtFlag = sale_upd.debt ?? current.debt;
  const nextDebtAmount = sale_upd.debt_amount ?? current.debt_amount;
  const nextDebt = nextDebtFlag && nextDebtAmount ? toRoundedInt(nextDebtAmount) : 0;

  const prevClientId = current.client_id;
  const nextClientId = sale_upd.client_id ?? prevClientId;

  return await db.transaction(async (tx) => {
    const updated = await tx
      .update(saleTable)
      .set(normalizedUpd)
      .where(and(eq(saleTable.tenant_id, tenantId), eq(saleTable.sale_id, sale_id)))
      .returning();

    const nextPayment = normalizedUpd.payment_method ?? String(current.payment_method);
    const nextDatetime = normalizedUpd.datetime ?? (current.datetime as any as Date);
    const nextSellerId = sale_upd.seller_id ?? current.seller_id;
    const nextTotalAmount = sale_upd.total_amount ?? String(current.total_amount ?? "0");
    const nextCurrency = sale_upd.currency ?? current.currency;

    await upsertCommissionExpense(
      tx,
      tenantId,
      sale_id,
      nextDatetime,
      nextPayment,
      nextCurrency,
      nextSellerId,
      nextTotalAmount,
    );

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

    if (sale_upd.gift_accessories !== undefined) {
      await revertExistingGiftsToStockAndDeleteBridge(tx, tenantId, sale_id);

      const { giftExpenseTotal, giftDescription } =
        await applyGiftStockAndBridgeInsert(tx, tenantId, sale_id, sale_upd.gift_accessories ?? []);

      const nextPayment = normalizedUpd.payment_method ?? String(current.payment_method);
      const nextDatetime = normalizedUpd.datetime ?? (current.datetime as any as Date);

      await upsertGiftExpense(
        tx,
        tenantId,
        sale_id,
        nextDatetime,
        nextPayment,
        nextCurrency,
        giftExpenseTotal,
        giftDescription
      );
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

    await softDeleteExpensesBySale(tx, tenantId, id);

    return true;
  });
}

// ------------------ analytics ------------------

export const getGrossIncome = async (tenantId: number, display: Currency, fx: any) => {

  const sales = await db.select({
      amount: saleTable.total_amount,
      debt_amount: saleTable.debt_amount,
      currency: saleTable.currency,
  }).from(saleTable).where(
      and(
          eq(saleTable.tenant_id, tenantId),
          eq(saleTable.is_deleted, false),
      )
  );
  
  const round2 = (n: number) => Math.round(n * 100) / 100;
  let gross = 0;
  for (const s of sales) {
      gross += convert(Number(s.amount), s.currency as Currency, display, fx.ratesToARS);
      if (s.debt_amount) {
          gross -= convert(Number(s.debt_amount), s.currency as Currency, display, fx.ratesToARS);
      }
  }
  gross = round2(gross);

  return gross;
};

export const getNetIncome = async (tenantId: number, display: Currency, fx: any) => {
  const result = await db
    .select({
      amount: saleTable.total_amount,
      buy_cost: phoneTable.buy_cost,
      currency: saleTable.currency,
    })
    .from(saleTable)
    .innerJoin(
      phoneTable,
      eq(saleTable.device_id, phoneTable.device_id)
    )
    .where(
      and(
        eq(saleTable.tenant_id, tenantId),
        eq(saleTable.is_deleted, false)
      )
    );

  let net = 0;
  for (const s of result) {
      net += convert(Number(s.amount), s.currency as Currency, display, fx.ratesToARS);
      net -= convert(Number(s.buy_cost), s.currency as Currency, display, fx.ratesToARS);
  }
  net = round2(net);

  return net;
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

export const getNetIncomeBreakdown = async (
  tenantId: number,
  display: Currency,
  fx: any
) => {
  const rows = await db
    .select({
      sale_id: saleTable.sale_id,
      device_name: phoneTable.name,

      buy_cost: sql<number>`COALESCE(${phoneTable.buy_cost}, 0)`,
      phone_currency: phoneTable.currency_buy,

      total_amount: sql<number>`COALESCE(${saleTable.total_amount}, 0)`,
      sale_currency: saleTable.currency,
    })
    .from(saleTable)
    .innerJoin(phoneTable, eq(saleTable.device_id, phoneTable.device_id))
    .where(and(eq(saleTable.tenant_id, tenantId), eq(saleTable.is_deleted, false)));

    return rows.map((r) => {
      const buy = Number(r.buy_cost ?? 0);
      const sale = Number(r.total_amount ?? 0);

      const buyCur: Currency = isCurrency(r.phone_currency) ? r.phone_currency : "ARS";
      const saleCur: Currency = isCurrency(r.sale_currency) ? r.sale_currency : "ARS";

      const buyDisplay = convert(buy, buyCur, display, fx.ratesToARS);
      const saleDisplay = convert(sale, saleCur, display, fx.ratesToARS);
      const netDisplay = saleDisplay - buyDisplay;

      return {
        sale_id: r.sale_id,
        device_name: r.device_name,
        displayCurrency: display,
        buy_display: fmtMoney(buy, r.phone_currency as Currency),
        sale_display: fmtMoney(sale, r.sale_currency as Currency),
        net_display: fmtMoney(netDisplay, display),
      };
    });
};

function startOfDayUTC(dateStr: string) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function nextDayUTC(dateStr: string) {
  const d = startOfDayUTC(dateStr);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

export async function getSellersOverviewMetrics(
  tenantId: number,
  display: Currency,
  fx: any
) {
  const from = new Date();
  from.setUTCMonth(from.getUTCMonth() - 6);
  const fromDate = startOfDayUTC(from.toISOString().slice(0, 10));
  const todayIso = new Date().toISOString().slice(0, 10);
  const toDateExclusive = nextDayUTC(todayIso);

  const rows = await db
    .select({
      amount: sql<number>`COALESCE(${saleTable.total_amount}, 0)`,
      currency: saleTable.currency,
      commission_pct: sql<number>`COALESCE(${sellerTable.commission}, 0)`,
    })
    .from(saleTable)
    .innerJoin(
      sellerTable,
      and(
        eq(sellerTable.tenant_id, tenantId),
        eq(sellerTable.seller_id, saleTable.seller_id)
      )
    )
    .where(
      and(
        eq(saleTable.tenant_id, tenantId),
        eq(saleTable.is_deleted, false),
        gte(saleTable.datetime, fromDate),
        lt(saleTable.datetime, toDateExclusive)
      )
    );

  let sales_count = 0;
  let total_sold_display = 0;
  let commission_total_display = 0;

  for (const r of rows) {
    sales_count += 1;

    const amt = Number(r.amount ?? 0);
    if (!Number.isFinite(amt)) continue;

    const cur: Currency = isCurrency(r.currency) ? r.currency : "ARS";
    const saleDisplay = convert(amt, cur, display, fx.ratesToARS);

    total_sold_display += saleDisplay;

    const pct = Number(r.commission_pct ?? 0);
    commission_total_display += saleDisplay * (pct / 100);
  }

  total_sold_display = round2(total_sold_display);
  commission_total_display = round2(commission_total_display);

  const avg_ticket =
    sales_count > 0 ? round2(total_sold_display / sales_count) : 0;

  return {
    displayCurrency: display,

    sales_count,

    total_sold: total_sold_display,
    total_sold_formatted: fmtMoney(total_sold_display, display),

    commission_total: commission_total_display,
    commission_total_formatted: fmtMoney(commission_total_display, display),

    avg_ticket,
    avg_ticket_formatted: fmtMoney(avg_ticket, display),

    range: {
      from: fromDate.toISOString(),
      toExclusive: toDateExclusive.toISOString(),
    },
  };
}


export async function getSalesCountBySeller(
  tenantId: number,
  filters?: {
    from?: string;
    to?: string;
  }
) {
  return await db
    .select({
      seller_id: sellerTable.seller_id,
      name: sellerTable.name,
      sales_count: sql<number>`CAST(COUNT(${saleTable.sale_id}) AS INTEGER)`,
    })
    .from(sellerTable)
    .leftJoin(
      saleTable,
      and(
        eq(saleTable.seller_id, sellerTable.seller_id),
        eq(saleTable.tenant_id, tenantId),
        eq(saleTable.is_deleted, false),
        filters?.from
          ? gte(saleTable.datetime, new Date(filters.from))
          : undefined,
        filters?.to
          ? lte(saleTable.datetime, new Date(filters.to))
          : undefined
      )
    )
    .where(
      and(
        eq(sellerTable.tenant_id, tenantId),
        eq(sellerTable.is_deleted, false)
      )
    )
    .groupBy(
      sellerTable.seller_id,
      sellerTable.name
    )
    .orderBy(
      sql`COUNT(${saleTable.sale_id}) DESC`
    );
}

export async function getSellerLeaderboard(
  tenantId: number,
  display: Currency,
  fx: any,
  opts?: { limit?: number } // from/to ya no se usan
) {
  const limit = Math.min(Math.max(Number(opts?.limit ?? 5), 1), 20);

  const from = new Date();
  from.setUTCMonth(from.getUTCMonth() - 6);
  const fromDate = startOfDayUTC(from.toISOString().slice(0, 10));

  // “hasta mañana” para incluir hoy completo
  const todayIso = new Date().toISOString().slice(0, 10);
  const toDateExclusive = nextDayUTC(todayIso);

  const rows = await db
    .select({
      seller_id: sellerTable.seller_id,
      name: sellerTable.name,
      commission_pct: sql<number>`COALESCE(${sellerTable.commission}, 0)`,
      amount: sql<number>`COALESCE(${saleTable.total_amount}, 0)`,
      currency: saleTable.currency,
      datetime: saleTable.datetime,
    })
    .from(saleTable)
    .innerJoin(
      sellerTable,
      and(
        eq(sellerTable.tenant_id, tenantId),
        eq(sellerTable.seller_id, saleTable.seller_id),
        eq(sellerTable.is_deleted, false)
      )
    )
    .where(
      and(
        eq(saleTable.tenant_id, tenantId),
        eq(saleTable.is_deleted, false),
        gte(saleTable.datetime, fromDate),
        lt(saleTable.datetime, toDateExclusive)
      )
    );

  const bySeller = new Map<
    number,
    {
      seller_id: number;
      name: string;
      commission_pct: number;
      sales_count: number;
      total_sold_display: number;
      commission_total_display: number;
    }
  >();

  for (const r of rows) {
    const sid = Number(r.seller_id);
    if (!Number.isFinite(sid)) continue;

    const amt = Number(r.amount ?? 0);
    if (!Number.isFinite(amt)) continue;

    const cur: Currency = isCurrency(r.currency) ? r.currency : "ARS";
    const saleDisplay = convert(amt, cur, display, fx.ratesToARS);

    const pct = Number(r.commission_pct ?? 0);
    const commissionAdd = saleDisplay * (pct / 100);

    const existing =
      bySeller.get(sid) ?? {
        seller_id: sid,
        name: String(r.name ?? ""),
        commission_pct: pct,
        sales_count: 0,
        total_sold_display: 0,
        commission_total_display: 0,
      };

    existing.sales_count += 1;
    existing.total_sold_display += saleDisplay;
    existing.commission_total_display += commissionAdd;

    existing.name = String(r.name ?? existing.name);
    existing.commission_pct = pct;

    bySeller.set(sid, existing);
  }

  return [...bySeller.values()]
    .map((s) => {
      const total_sold = round2(s.total_sold_display);
      const commission_total = round2(s.commission_total_display);
      const avg_ticket = s.sales_count > 0 ? round2(total_sold / s.sales_count) : 0;

      return {
        seller_id: s.seller_id,
        name: s.name,
        sales_count: s.sales_count,

        total_sold,
        total_sold_formatted: fmtMoney(total_sold, display),

        commission_total,
        commission_total_formatted: fmtMoney(commission_total, display),

        avg_ticket,
        avg_ticket_formatted: fmtMoney(avg_ticket, display),

        displayCurrency: display,
      };
    })
    .sort((a, b) => b.total_sold - a.total_sold)
    .slice(0, limit);
}

export async function getSalesOverviewMetrics(
  tenantId: number,
  filters?: { from?: string; to?: string }
) {
  const fromDate = filters?.from ? startOfDayUTC(filters.from) : undefined;
  const toDateExclusive = filters?.to ? nextDayUTC(filters.to) : undefined;

  const rows = await db
    .select({
      sales_count: sql<number>`CAST(COUNT(${saleTable.sale_id}) AS INTEGER)`,
      total_sold: sql<string>`COALESCE(SUM(${saleTable.total_amount}), 0)::text`,
      debt_sales_count: sql<number>`
        CAST(
          COUNT(
            CASE 
              WHEN ${saleTable.debt} = true 
              AND COALESCE(${saleTable.debt_amount}, 0) > 0 
              THEN 1 
            END
          ) AS INTEGER
        )
      `,
    })
    .from(saleTable)
    .where(
      and(
        eq(saleTable.tenant_id, tenantId),
        eq(saleTable.is_deleted, false),
        fromDate ? gte(saleTable.datetime, fromDate) : undefined,
        toDateExclusive ? lt(saleTable.datetime, toDateExclusive) : undefined
      )
    );

  const r = rows[0] ?? ({} as any);

  const sales_count = Number(r.sales_count ?? 0);
  const total_sold = Number(r.total_sold ?? 0);

  const avg_ticket =
    sales_count > 0 ? Number((total_sold / sales_count).toFixed(2)) : 0;

  return {
    sales_count,
    total_sold: Number(total_sold.toFixed(2)),
    avg_ticket,
    debt_sales_count: Number(r.debt_sales_count ?? 0),
  };
}

function startOfMonthUTC(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function nextMonthUTC(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

export async function getSalesPublicOverviewWithMonthSeries(
  tenantId: number,
  display: Currency,
  fx: any,
) {
  const from = startOfMonthUTC(new Date());
  const to = nextMonthUTC(new Date());

  // 1) Conteos (SQL) + debt_sales_count (SQL)
  const overviewRows = await db
    .select({
      sales_count: sql<number>`CAST(COUNT(${saleTable.sale_id}) AS INTEGER)`,
      debt_sales_count: sql<number>`
        CAST(
          COUNT(
            CASE 
              WHEN ${saleTable.debt} = true 
              AND COALESCE(${saleTable.debt_amount}, 0) > 0 
              THEN 1 
            END
          ) AS INTEGER
        )
      `,
    })
    .from(saleTable)
    .where(and(eq(saleTable.tenant_id, tenantId), eq(saleTable.is_deleted, false)));

  const o = overviewRows[0] ?? ({} as any);
  const sales_count = Number(o.sales_count ?? 0);

  // 2) Total vendido all-time convertido a display (fila a fila)
  const salesMoneyRows = await db
    .select({
      amount: sql<number>`COALESCE(${saleTable.total_amount}, 0)`,
      currency: saleTable.currency,
    })
    .from(saleTable)
    .where(and(eq(saleTable.tenant_id, tenantId), eq(saleTable.is_deleted, false)));

  let total_sold_all_time_display = 0;
  for (const r of salesMoneyRows) {
    const amt = Number(r.amount ?? 0);
    if (!Number.isFinite(amt) || amt === 0) continue;

    const cur: Currency = isCurrency(r.currency) ? r.currency : "ARS";
    total_sold_all_time_display += convert(amt, cur, display, fx.ratesToARS);
  }
  total_sold_all_time_display = round2(total_sold_all_time_display);

  const avg_ticket =
    sales_count > 0 ? round2(total_sold_all_time_display / sales_count) : 0;

  // 3) Serie diaria del mes corriente (solo conteos) — igual que antes
  const seriesRows = await db
    .select({
      day: sql<string>`to_char(DATE_TRUNC('day', ${saleTable.datetime}), 'YYYY-MM-DD')`,
      sold_count: sql<number>`CAST(COUNT(${saleTable.sale_id}) AS INTEGER)`,
    })
    .from(saleTable)
    .where(
      and(
        eq(saleTable.tenant_id, tenantId),
        eq(saleTable.is_deleted, false),
        gte(saleTable.datetime, from),
        lt(saleTable.datetime, to)
      )
    )
    .groupBy(sql`DATE_TRUNC('day', ${saleTable.datetime})`)
    .orderBy(sql`DATE_TRUNC('day', ${saleTable.datetime}) ASC`);

  const map = new Map<string, number>();
  for (const r of seriesRows as any[]) map.set(String(r.day), Number(r.sold_count ?? 0));

  const points: { day: string; sold_count: number }[] = [];
  const cursor = new Date(from);
  while (cursor < to) {
    const dayStr = cursor.toISOString().slice(0, 10);
    points.push({ day: dayStr, sold_count: map.get(dayStr) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return {
    displayCurrency: display,
    total_sold_all_time: total_sold_all_time_display, // ✅ opcional, pero útil
    avg_ticket: fmtMoney(avg_ticket, display),
    debt_sales_count: Number(o.debt_sales_count ?? 0),
    month_series: points,
  };
}
