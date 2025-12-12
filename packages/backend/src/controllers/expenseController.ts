import { Elysia, t } from "elysia";
import { getAllExpenses, getExpensesByFilter, addExpense, updateExpense, softDeleteExpense, getTotalExpenses } from "../services/expenseService";
import { expenseInsertDTO, expenseUpdateDTO } from "@server/db/types";

export const expenseController = new Elysia({prefix: "/expense"})
    .get("/", () => {
        return { message: "Expense endpoint" };
    })
    .get(
        "/all",
        async ({ query }) => {
            if (query.datetime || 
                query.category || 
                query.payment_method) {
                return await getExpensesByFilter(
                    query.datetime,
                    query.category,
                    query.payment_method,
                ); //Filter by parameters
            }

            return await getAllExpenses();
        },
        {
            detail: {
                summary: "Get all expenses in DB",
                tags: ["expenses"],
            },
        },
    )
    .post(
        "/",
        async ({body, set}) => {

            const newExpense = {
                datetime: body.datetime ? new Date(body.datetime) : undefined,
                category: body.category,
                ...(body.description && {description: body.description}),
                amount: body.amount,
                payment_method: body.payment_method,
                ...(body.receipt_number && {receipt_number: body.receipt_number}),
                ...(body.provider_id && {provider_id: body.provider_id}),
            };
            
            const result = await addExpense(newExpense);
            set.status = 201;
            return result;
        },
        {
            body: t.Object({
                ...expenseInsertDTO.properties,
                datetime: t.Optional(t.String({format: "date-time"})),
            }),
            detail: {
                summary: "Insert a new expense",
                tags: ["expenses"],
            },
        }
    )
    .put(
        "/:id",
        async ({ body, params: { id }, set }) => {

            const updExpense = {
                category: body.category,
                ...(body.description && {description: body.description}),
                amount: body.amount,
                payment_method: body.payment_method,
                ...(body.receipt_number && {receipt_number: body.receipt_number}),
                ...(body.provider_id && {provider_id: body.provider_id}),
            };

            const result = await updateExpense(
                Number(id),
                updExpense,
            );
            set.status = 200;
            return result;
        },
        {
            body: t.Object({
                ...expenseUpdateDTO.properties,
                datetime: t.Optional(t.String({format: "date-time"})),
            }),
            detail: {
                summary: "Update an expense",
                tags: ["expenses"],
            },
        },
    )
    .delete("/:id", async ({ params: { id }, set }) => {
        const ok = await softDeleteExpense(Number(id));
        set.status = ok ? 200 : 404;
        return ok;
    })
    .get("/expenses", async () => {
            const expenses = await getTotalExpenses();
            return expenses;
        },
        {
            detail: {
                summary: "Get expenses",
                tags: ["sales"],
            },
        }
    )