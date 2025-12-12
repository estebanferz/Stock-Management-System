import { Elysia, t } from "elysia";
import { getAllPhones, getPhonesByFilter, getPhoneById, addPhone, updatePhone, softDeletePhone } from "../services/phoneService";
import { phoneInsertDTO, phoneUpdateDTO } from "@server/db/types";
import { date } from "drizzle-orm/mysql-core";

export const phoneController = new Elysia({prefix: '/phone'})
    .get("/", () => {
        return { message: "Phone endpoint" };
    })
    .get(
        "/all",
        async ({ query }) => {
            if (query.name || 
                query.device_type || 
                query.brand ||
                query.sold) {
                return await getPhonesByFilter(
                    query.name,
                    query.device_type,
                    query.brand,
                    query.sold,
                ); //Filter by parameters
            }

            return await getAllPhones();
        },
        {
            query: t.Object({
                name: t.Optional(t.String()),
                device_type: t.Optional(t.String()),
                brand: t.Optional(t.String()),
                sold: t.Optional(t.String()), // llega como string siempre
            }),
            detail: {
                summary: "Get all phones in DB",
                tags: ["phones"],
            },
        },
    )
    .get(
        "/:id",
        async (req) => {
            const { id } = req.params;
            return await getPhoneById(Number(id));
        },
        {
            detail: {
                summary: "Get phone details by ID",
                tags: ["phones"],
            },
        }
    )
    .post(
        "/",
        async ({body, set}) => {

            const newPhone = {
                datetime: new Date(body.datetime),
                name: body.name,
                brand: body.brand,
                imei: body.imei,
                device_type: body.device_type,
                ...(body.battery_health && {battery_health: body.battery_health}),
                ...(body.storage_capacity && {storage_capacity: body.storage_capacity}),
                ...(body.color && {color: body.color}),
                category: body.category,
                price: body.price,
                buy_cost: body.buy_cost,
                deposit: body.deposit,
                ...(body.sold && {sold: body.sold}),
                ...(body.trade_in && {trade_in: body.trade_in}),
            };
            
            const result = await addPhone(newPhone);
            set.status = 201;
            return result;
        },
        {
            body: t.Object({
                ...phoneInsertDTO.properties,
                datetime: t.String({ format: "date-time" })
            }),
            detail: {
                summary: "Insert a new phone",
                tags: ["phones"],
            },
        }
    )
    .put(
        "/:id",
        async ({ body, params: { id }, set }) => {

            const updPhone = {
                name: body.name,
                brand: body.brand,
                imei: body.imei,
                device_type: body.device_type,
                ...(body.battery_health && {battery_health: body.battery_health}),
                ...(body.storage_capacity && {storage_capacity: body.storage_capacity}),
                ...(body.color && {color: body.color}),
                category: body.category,
                price: body.price,
                buy_cost: body.buy_cost,
                deposit: body.deposit,
                ...(body.sold && {sold: body.sold}),
            };

            const result = await updatePhone(
                Number(id),
                updPhone,
            );
            set.status = 200;
            return result;
        },
        {
            body: t.Object({
                ...phoneUpdateDTO.properties,
                datetime: t.String({ format: "date-time" }),
            }),
            detail: {
                summary: "Update a phone",
                tags: ["phones"],
            },
        },
    )
    .delete("/:id", async ({ params: { id }, set }) => {
        const ok = await softDeletePhone(Number(id));
        set.status = ok ? 200 : 404;
        return ok;
    });
