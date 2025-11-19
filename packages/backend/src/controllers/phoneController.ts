import { Elysia, t } from "elysia";
import { getAllPhones, getPhonesByFilter, addPhone, updatePhone, deletePhone } from "../services/phoneService";
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
                query.brand) {
                return await getPhonesByFilter(
                    query.name,
                    query.device_type,
                    query.brand,
                ); //Filter by parameters
            }

            return await getAllPhones();
        },
        {
            detail: {
                summary: "Get all phones in DB",
                tags: ["phones"],
            },
        },
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
        "/:device_id",
        async ({ body, params: { device_id }, set }) => {

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
                Number(device_id),
                updPhone,
            );
            set.status = 200;
            return result;
        },
        {
            body: t.Object({
                ...phoneUpdateDTO.properties,
            }),
            detail: {
                summary: "Update a phone",
                tags: ["phones"],
            },
        },
    )
    .delete(
        "/:device_id",
        async ({ params: { device_id }, set }) => {
            const phoneIdNum = Number(device_id);
            if (!Number.isInteger(phoneIdNum) || phoneIdNum <= 0) {
                set.status = 400;
                return false;
            }

            const result = await deletePhone(phoneIdNum);
            if (!result) {
                set.status = 404;
                return false;
            }

            set.status = 200;
            return true;
        },
        {
            params: t.Object({
                device_id: t.Numeric({
                    minimum: 1,
                    errorMessage: 'device_id must be a positive integer',
                })
            }),
            detail: {
                summary: "Delete a phone",
                tags: ["phones"],
            },
        },
    )
