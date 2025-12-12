import { db } from "@server/db/db";
import { phoneTable } from "@server/db/schema.ts";
import { ilike, and, eq } from "drizzle-orm";
import { normalizeShortString } from "../util/formattersBackend";

export async function getPhonesByFilter(
    name?: string,
    device_type?: string,
    brand?: string,
    sold?: string,
){
    let soldFormatted = false
    if (sold){sold == "true" ? soldFormatted = true : soldFormatted = false}
    const result = await db
    .select()
    .from(phoneTable)
    .where(
      and(
        name ? ilike(phoneTable.name, `%${name}%`) : undefined,
        device_type ? ilike(phoneTable.device_type, device_type) : undefined, // ya convertido y validado
        brand ? ilike(phoneTable.brand, `%${brand}%`) : undefined,
        sold ? eq(phoneTable.sold, soldFormatted) : undefined,
        eq(phoneTable.is_deleted, false),
      ),
    );
    
    return result;
}

export const getAllPhones = async () => {
    return await db.select().from(phoneTable).where(eq(phoneTable.is_deleted, false)).orderBy(phoneTable.device_id);
}

export const getPhoneById = async(id: number) => {
    const phone = await db.query.phoneTable.findFirst({
        where: eq(phoneTable.device_id, id),
    });
    
    
    return phone;
}

export const addPhone = async ( newPhone: {
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

    const result = await db
        .insert(phoneTable)
        .values(normalizedPhone)
        .returning();

    return result;
}

export async function updatePhone(
    device_id: number,
    phone_upd: {
        name?: string;
        brand?: string;
        imei?: string;
        device_type?: string;
        battery_health?: number;
        storage_capacity?: number;
        color?: string;
        category?: string;
        price?: string;
        buy_cost?: string;
        deposit?: string;
        sold?: boolean;
    },
){
    const result = await db
        .update(phoneTable)
        .set(phone_upd)
        .where(eq(phoneTable.device_id, device_id))
        .returning();

    return result
}

export async function softDeletePhone(id: number) {
    const result = await db
        .update(phoneTable)
        .set({ is_deleted: true })
        .where(eq(phoneTable.device_id, id))
        .returning();

    return result.length > 0;
}