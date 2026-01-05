import { db } from "@server/db/db";
import { phoneTable } from "@server/db/schema.ts";
import { ilike, and, eq, or, gte } from "drizzle-orm";
import { normalizeShortString } from "../util/formattersBackend";

export async function getPhonesByFilter(
  tenantId: number,
  filters: {
    device?: string;
    imei?: string;
    color?: string;
    storage_capacity?: string;
    battery_health?: string;
    category?: string;
    device_type?: string;
    trade_in?: string;
    sold?: string;
    is_deleted?: boolean;
  }
) {
  return await db
    .select()
    .from(phoneTable)
    .where(
      and(
        eq(phoneTable.tenant_id, tenantId),

        filters.device
          ? or(
              ilike(phoneTable.name, `%${filters.device}%`),
              ilike(phoneTable.brand, `%${filters.device}%`)
            )
          : undefined,

        filters.imei ? eq(phoneTable.imei, filters.imei) : undefined,

        filters.color ? ilike(phoneTable.color, `%${filters.color}%`) : undefined,

        filters.storage_capacity
          ? eq(phoneTable.storage_capacity, Number(filters.storage_capacity))
          : undefined,

        filters.battery_health
          ? gte(phoneTable.battery_health, Number(filters.battery_health))
          : undefined,

        filters.category ? eq(phoneTable.category, filters.category) : undefined,

        filters.device_type ? eq(phoneTable.device_type, filters.device_type) : undefined,

        filters.trade_in !== undefined
          ? eq(phoneTable.trade_in, filters.trade_in === "true")
          : undefined,

        filters.sold !== undefined ? eq(phoneTable.sold, filters.sold === "true") : undefined,

        filters.is_deleted !== undefined ? eq(phoneTable.is_deleted, filters.is_deleted) : undefined
      )
    )
    .orderBy(phoneTable.device_id);
}

export const getAllPhones = async (tenantId: number) => {
  return await db
    .select()
    .from(phoneTable)
    .where(eq(phoneTable.tenant_id, tenantId))
    .orderBy(phoneTable.device_id);
};

export const getPhoneById = async (tenantId: number, id: number) => {
  const phone = await db.query.phoneTable.findFirst({
    where: and(eq(phoneTable.tenant_id, tenantId), eq(phoneTable.device_id, id)),
  });

  return phone;
};

export const addPhone = async (newPhone: {
  tenant_id: number;
  datetime: Date;
  name: string;
  brand: string;
  imei: string;
  device_type: string;
  battery_health?: number;
  storage_capacity?: number;
  color?: string;
  category: string;
  price: string;
  buy_cost: string;
  deposit: string;
  sold?: boolean;
  trade_in?: boolean;
}) => {
  const normalizedPhone = {
    ...newPhone,
    name: normalizeShortString(newPhone.name),
    brand: normalizeShortString(newPhone.brand),
    device_type: normalizeShortString(newPhone.device_type),
    category: normalizeShortString(newPhone.category),
    color: newPhone.color ? normalizeShortString(newPhone.color) : undefined,
    imei: newPhone.imei.trim(),
    price: newPhone.price,
    buy_cost: newPhone.buy_cost,
    deposit: newPhone.deposit,
  };

  return await db.insert(phoneTable).values(normalizedPhone).returning();
};

export async function updatePhone(
  tenantId: number,
  device_id: number,
  phone_upd: {
    name: string;
    datetime?: Date;
    brand: string;
    imei: string;
    device_type: string;
    battery_health?: number;
    storage_capacity?: number;
    color?: string;
    category: string;
    price?: string;
    buy_cost?: string;
    deposit?: string;
    sold?: boolean;
    trade_in?: boolean;
  }
) {
  const normalizedPhone = {
    ...phone_upd,
    name: normalizeShortString(phone_upd.name),
    brand: normalizeShortString(phone_upd.brand),
    device_type: normalizeShortString(phone_upd.device_type),
    category: normalizeShortString(phone_upd.category),
    color: phone_upd.color ? normalizeShortString(phone_upd.color) : undefined,
    imei: phone_upd.imei.trim(),
    price: phone_upd.price,
    buy_cost: phone_upd.buy_cost,
    deposit: phone_upd.deposit,
  };

  const result = await db
    .update(phoneTable)
    .set(normalizedPhone)
    .where(and(eq(phoneTable.tenant_id, tenantId), eq(phoneTable.device_id, device_id)))
    .returning();

  return result;
}

export async function softDeletePhone(tenantId: number, id: number) {
  const result = await db
    .update(phoneTable)
    .set({ is_deleted: true })
    .where(and(eq(phoneTable.tenant_id, tenantId), eq(phoneTable.device_id, id)))
    .returning();

  return result.length > 0;
}
