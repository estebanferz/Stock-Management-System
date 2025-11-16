import { Elysia, t } from "elysia";
import { getAllSales, getSaleByFilter, addSale, updateSale, deleteSale } from "../services/saleService";
import { saleInsertDTO, saleUpdateDTO } from "@server/db/types";
import { datetime } from "drizzle-orm/mysql-core";

export const saleController = new Elysia({prefix: '/sale'})
    .get("/", () => {
        return { message: "Sale endpoint" };
    })
    .get(
        "/all",
        async ({ query }) => {
            if (query.datetime ||
                query.client_id ||
                query.seller_id ||
                query.device_id
            ) {
                return await getSaleByFilter(
                    query.datetime,
                    query.client_id,
                    query.seller_id, 
                    query.device_id
                ); //Filter by parameter
            }

            return await getAllSales();
        },
        {
            detail: {
                summary: "Get all sales in DB",
                tags: ["sales"],
            },
        },
    )
    .post(
        "/",
        async ({body, set}) => {

            const newSale = {
                datetime: body.datetime ? new Date(body.datetime) : undefined,
                total_amount: body.total_amount,
                payment_method: body.payment_method,
                debt: body.debt,
                ...(body.debt_amount && {debt_amount: body.debt_amount}),
                client_id: body.client_id,
                seller_id: body.seller_id,
                device_id: body.device_id,
            };
            
            const result = await addSale(newSale);
            set.status = 201;
            return result;
        },
        {
            body: t.Object({
                ...saleInsertDTO.properties,
                datetime: t.Optional(t.String({ format: "date-time" }))
            }),
            detail: {
                summary: "Insert a new sale",
                tags: ["sales"],
            },
        }
    )
    .put(
        "/:sale_id",
        async ({ body, params: { sale_id }, set }) => {

            const updSale = {
                total_amount: body.total_amount,
                payment_method: body.payment_method,
                debt: body.debt,
                ...(body.debt_amount && {debt_amount: body.debt_amount}),
                client_id: body.client_id,
                seller_id: body.seller_id,
                device_id: body.device_id, 
            };

            const result = await updateSale(
                Number(sale_id),
                updSale,
            );
            set.status = 200;
            return result;
        },
        {
            body: t.Object({
                ...saleUpdateDTO.properties,
            }),
            detail: {
                summary: "Update a sale",
                tags: ["sales"],
            },
        },
    )
    .delete(
        "/:sale_id",
        async ({ params: { sale_id }, set }) => {
            const saleIdNum = Number(sale_id);
            if (!Number.isInteger(saleIdNum) || saleIdNum <= 0) {
                set.status = 400;
                return false;
            }

            const result = await deleteSale(saleIdNum);
            if (!result) {
                set.status = 404;
                return false;
            }

            set.status = 200;
            return true;
        },
        {
            params: t.Object({
                sale_id: t.Numeric({
                    minimum: 1,
                    errorMessage: 'sale_id must be a positive integer',
                })
            }),
            detail: {
                summary: "Delete a sale",
                tags: ["sales"],
            },
        },
    )