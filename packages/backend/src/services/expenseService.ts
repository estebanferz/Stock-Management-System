import { db } from "@server/db/db";
import { expenseTable } from "@server/db/schema.ts";
import { ilike, and, eq, sql } from "drizzle-orm"

export async function getExpensesByFilter(
    datetime?: string,
    category?: string,
    payment_method?: string,
){

    const result = await db
    .select()
    .from(expenseTable)
    .where(
      and(
        datetime ? eq(sql`date(${expenseTable.datetime})`, `%${datetime}%`) : undefined,
        category ? ilike(expenseTable.category, `%${category}%`) : undefined, // ya convertido y validado
        payment_method ? ilike(expenseTable.payment_method, `%${payment_method}%`) : undefined,
      ),
    );
    
    return result;
}

export const getAllExpenses = async () => {
    return await db.select().from(expenseTable);
}

export const addExpense = async ( newExpense: {
    category: string;
    description?: string;
    amount: string;
    payment_method: string;
    receipt_number?: string;
    provider_id?: number;
}) => {
    const result = await db
        .insert(expenseTable)
        .values({
            ...newExpense,
        })
        .returning();

    return result;
}

export const updateExpense = async (
    expense_id: number,
    expense_upd: {
        category?: string,
        description?: string,
        amount?: string,
        payment_method?: string,
        receipt_number?: string,
        provider_id?: number
    }
) => {
    const result = await db
        .update(expenseTable)
        .set(expense_upd)
        .where(eq(expenseTable.expense_id, expense_id))
        .returning();
}

export const deleteExpense = async (expense_id: number) => {
    const result = await db
        .delete(expenseTable)
        .where(eq(expenseTable.expense_id, expense_id))
        .returning();

    if (result.length > 0) {return true}
    else {return false}
}