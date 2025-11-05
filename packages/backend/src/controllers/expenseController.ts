import { Elysia, t } from "elysia";
import { getAllExpenses, getExpensesByFilter, addExpense, updateExpense, deleteExpense } from "../services/expenseService";
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
            }),
            detail: {
                summary: "Insert a new expense",
                tags: ["expenses"],
            },
        }
    )
    .put(
        "/:expense_id",
        async ({ body, params: { expense_id }, set }) => {

            const updExpense = {
                category: body.category,
                ...(body.description && {description: body.description}),
                amount: body.amount,
                payment_method: body.payment_method,
                ...(body.receipt_number && {receipt_number: body.receipt_number}),
                ...(body.provider_id && {provider_id: body.provider_id}),
            };

            const result = await updateExpense(
                Number(expense_id),
                updExpense,
            );
            set.status = 200;
            return result;
        },
        {
            body: t.Object({
                ...expenseUpdateDTO.properties,
            }),
            detail: {
                summary: "Update an expense",
                tags: ["expenses"],
            },
        },
    )
    .delete(
        "/:expense_id",
        async ({ params: { expense_id }, set }) => {
            const expenseIdNum = Number(expense_id);
            if (!Number.isInteger(expenseIdNum) || expenseIdNum <= 0) {
                set.status = 400;
                return false;
            }

            const result = await deleteExpense(expenseIdNum);
            if (!result) {
                set.status = 404;
                return false;
            }

            set.status = 200;
            return true;
        },
        {
            params: t.Object({
                expense_id: t.Numeric({
                    minimum: 1,
                    errorMessage: 'expense_id must be a positive integer',
                })
            }),
            detail: {
                summary: "Delete an expense",
                tags: ["expenses"],
            },
        },
    )
