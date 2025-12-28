import { Elysia, t } from "elysia";
import { getAllExpenses, getExpensesByFilter, addExpense, updateExpense, softDeleteExpense, getTotalExpenses, addExpenseWithReceipt, updateExpenseWithReceipt, getExpenseReceiptFile } from "../services/expenseService";
import { expenseInsertDTO, expenseUpdateDTO } from "@server/db/types";
import { safeFilename } from "../util/formattersBackend";
import { requireAuth } from "../middlewares/requireAuth";

export const expenseController = new Elysia({prefix: "/expense"})
    .use(requireAuth)
    .get("/", () => {
        return { message: "Expense endpoint" };
    })
    .get(
    "/all",
    async (ctx) => {
        const userId = ctx.user.user_id
        const { query } = ctx

        if (
        query.date ||
        query.category ||
        query.payment_method ||
        query.provider_id ||
        query.amount_min ||
        query.amount_max ||
        query.is_deleted
        ){
        return await getExpensesByFilter(userId, {
            date: query.date,
            category: query.category,
            payment_method: query.payment_method,
            provider_id: query.provider_id,
            amount_min: query.amount_min,
            amount_max: query.amount_max,
            is_deleted: query.is_deleted === undefined ? undefined : query.is_deleted === "true",
        });
        }

        return await getAllExpenses(userId);
    },
    {
        detail: {
        summary: "Get all expenses in DB",
        tags: ["expenses"],
        },
    },
    )

    .get("/:id/receipt", async (ctx) => {
        const userId = ctx.user.user_id;
        const expenseId = Number(ctx.params.id);

        const receipt = await getExpenseReceiptFile(userId, expenseId);

        if (!receipt) {
            ctx.set.status = 404;
            return;
        }

        const filename = safeFilename(receipt.originalName);

        ctx.set.headers["Content-Type"] = receipt.mime;

        // ✅ filename ASCII-safe
        ctx.set.headers["Content-Disposition"] =
            `inline; filename="${filename}"`;

        return receipt.file;
    })
    .post(
    "/",
    async (ctx) => {
        const userId = ctx.user.user_id;
        const { body, set } = ctx;
        try {
        const result = await addExpenseWithReceipt(userId, body);
        set.status = 201;
        return result;
        } catch (err: any) {
        switch (err.message) {
            case "INVALID_RECEIPT_TYPE":
            set.status = 400;
            return { error: "Tipo de archivo no permitido" };

            case "RECEIPT_TOO_LARGE":
            set.status = 400;
            return { error: "El archivo supera los 5MB" };

            default:
            throw err;
        }
        }
    },
    {
        body: t.Object({
        ...expenseInsertDTO.properties,

        datetime: t.Optional(
            t.String({ format: "date-time" })
        ),

        receipt: t.Optional(t.File()),

        provider_id: t.Optional(
            t.Union([t.Integer(), t.Null(), t.String()])
        ),
        }),
        detail: {
        summary: "Insert a new expense (with optional receipt)",
        tags: ["expenses"],
        },
    }
    )
    .put(
    "/:id",
    async (ctx) => {
        const userId = ctx.user.user_id;
        const expenseId = Number(ctx.params.id);
        const { body, set } = ctx;
        try {
        const result = await updateExpenseWithReceipt(userId, expenseId, body);
        set.status = 200;
        return result;
        } catch (err: any) {
        switch (err.message) {
            case "INVALID_RECEIPT_TYPE":
            set.status = 400;
            return { error: "Tipo de archivo no permitido" };

            case "RECEIPT_TOO_LARGE":
            set.status = 400;
            return { error: "El archivo supera los 5MB" };

            case "EXPENSE_NOT_FOUND":
            set.status = 404;
            return { error: "Gasto no encontrado" };

            default:
            throw err;
        }
        }
    },
    {
        body: t.Object({
        ...expenseUpdateDTO.properties,

        datetime: t.Optional(
            t.String({ format: "date-time" })
        ),

        receipt: t.Optional(t.File()),

        provider_id: t.Optional(
            t.Union([t.Integer(), t.Null(), t.String()])
        ),
        }),
        detail: {
        summary: "Update an expense (with optional receipt)",
        tags: ["expenses"],
        },
    }
    )
    .delete("/:id", async (ctx) => {
        const userId = ctx.user.user_id;
        const expenseId = Number(ctx.params.id);
        const ok = await softDeleteExpense(userId, expenseId);
        ctx.set.status = ok ? 200 : 404;
        return ok;
    })
    .get("/expenses", async (ctx) => {
            const userId = ctx.user.user_id
            const expenses = await getTotalExpenses(userId);
            return expenses;
        },
        {
            detail: {
                summary: "Get expenses",
                tags: ["sales"],
            },
        }
    )