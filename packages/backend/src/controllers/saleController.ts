import { Elysia, t } from "elysia";
import { getAllSales, getSaleByFilter, getSaleById, addSale, updateSale, softDeleteSale } from "../services/saleService";
import { saleInsertDTO, saleUpdateDTO } from "@server/db/types";
import { getGrossIncome, getNetIncome, getSalesCountByMonth, getProductSoldCount, getDebts, getTotalDebt } from "../services/saleService";
import { db } from "@server/db/db";

export const saleController = new Elysia({prefix: '/sale'})
    .get("/", () => {
        return { message: "Sale endpoint" };
    })
    .get(
    "/all",
    async ({ query }) => {
        if (
        query.date ||
        query.client_id ||
        query.seller_id ||
        query.device_id ||
        query.is_deleted
        ) {
        return await getSaleByFilter({
            date: query.date,
            client_id: query.client_id,
            seller_id: query.seller_id,
            device_id: query.device_id,
            is_deleted: query.is_deleted === undefined ? undefined : query.is_deleted === "true",
        });
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
    .get(
        "/:id",
        async (req) => {
            const { id } = req.params;
            return await getSaleById(Number(id));
        },
        {
            detail: {
                summary: "Get sale details by ID",
                tags: ["sales"],
            },
        }
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
                ...(body.trade_in_device && {trade_in_device: body.trade_in_device}),
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
        "/:id",
        async ({ body, params: { id }, set }) => {

            const updSale = {
                datetime: body.datetime ? new Date(body.datetime) : undefined,
                total_amount: body.total_amount,
                payment_method: body.payment_method,
                debt: body.debt,
                ...(body.debt_amount && {debt_amount: body.debt_amount}),
                client_id: body.client_id,
                seller_id: body.seller_id,
                device_id: body.device_id, 
            };

            const result = await updateSale(
                Number(id),
                updSale,
            );
            set.status = 200;
            return result;
        },
        {
            body: t.Object({
                ...saleUpdateDTO.properties,
                datetime: t.Optional(t.String({ format: "date-time" }))
            }),
            detail: {
                summary: "Update a sale",
                tags: ["sales"],
            },
        },
    )
    .delete("/:id", async ({ params: { id }, set }) => {
        const ok = await softDeleteSale(Number(id));
        set.status = ok ? 200 : 404;
        return ok;
    })
    .get("/gross-income", async () => {
            const grossIncome = await getGrossIncome();
            return grossIncome;
        },
        {
            detail: {
                summary: "Get gross income",
                tags: ["sales"],
            },
        })
    .get("/net-income", async () => {
            const netIncome = await getNetIncome();
            return netIncome;
        },
        {
            detail: {
                summary: "Get net income",
                tags: ["sales"],
            },
        }
    )
    .get("/sales-by-month", async () => {
        return await getSalesCountByMonth();
    },
    {
        detail: {
            summary: "Get net income",
            tags: ["sales"],
        },
    }
    )
    .get("/products-sold-count", async () => {
        return await getProductSoldCount();
    },
    {
        detail: {
            summary: "Get products sold count",
            tags: ["sales"],
        },
    }
    )
    .get("/debts", async() => {
        return await getDebts();
    },
    {
        detail: {
            summary: "Get all debts",
            tags: ["sales"],
        },
    })
    .get("/total-debt", async() => {
        return await getTotalDebt();
    },
    {
        detail: {
            summary: "Get total debt amount",
            tags: ["sales"],
        },
    }
    );