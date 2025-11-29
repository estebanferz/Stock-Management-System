import { db } from "@server/db/db";
import { phoneTable } from "@server/db/schema.ts";
import { ilike, and, eq } from "drizzle-orm"

export async function getPhonesByFilter(
    name?: string,
    device_type?: string,
    brand?: string,
){

    const result = await db
    .select()
    .from(phoneTable)
    .where(
      and(
        name ? ilike(phoneTable.name, `%${name}%`) : undefined,
        device_type ? ilike(phoneTable.device_type, device_type) : undefined, // ya convertido y validado
        brand ? ilike(phoneTable.brand, `%${brand}%`) : undefined,
      ),
    );
    
    return result;
}

export const getAllPhones = async () => {
    return await db.select().from(phoneTable);
}

export const getPhoneById = async(id: number) => {
    const sale = await db.query.phoneTable.findFirst({
        where: eq(phoneTable.device_id, id),
    });
    return sale;
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
}) => {
    const result = await db
        .insert(phoneTable)
        .values({
            ...newPhone,
        })
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

    if (result) {return true}
    else {return false}
}

export const deletePhone = async (device_id: number) => {
    const result = await db
        .delete(phoneTable)
        .where(eq(phoneTable.device_id, device_id))
        .returning();

    if (result.length > 0) {return true}
    else {return false}
}