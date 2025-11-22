import { db } from "@server/db/db";
import { saleTable, expenseTable } from "@server/db/schema.ts";
import { ilike, and, eq, sql } from "drizzle-orm"

export async function getSaleByFilter(
    datetime?: string,
    client_id?: string,
    seller_id?: string,
    device_id?: string,
){

    const result = await db
    .select()
    .from(saleTable)
    .where(
      and(
        datetime ? eq(sql`date(${saleTable.datetime})`, `%${datetime}%`) : undefined,
        client_id ? eq(saleTable.client_id, Number(client_id)) : undefined,
        seller_id ? eq(saleTable.seller_id, Number(seller_id)) : undefined,
        device_id ? eq(saleTable.device_id, Number(device_id)) : undefined,
      ),
    );
    
    return result;
}

export const getAllSales = async () => {
    return await db.select().from(saleTable);
}

export const addSale = async ( newSale: {
    total_amount: string;
    payment_method: string;
    datetime?: Date;
    debt?: boolean;
    debt_amount?: string;
    client_id: number;
    seller_id: number;
    device_id: number;
}) => {
    const result = await db
        .insert(saleTable)
        .values({
            ...newSale,
        })
        .returning();

    return result;
}

export async function updateSale(
    sale_id: number,
    sale_upd: {
        total_amount?: string;
        payment_method?: string;
        debt?: boolean;
        debt_amount?: string;
        client_id?: number;
        seller_id?: number;
        device_id?: number;
    },
){
    const result = await db
        .update(saleTable)
        .set(sale_upd)
        .where(eq(saleTable.sale_id, sale_id))
        .returning();

    return result;
}

export const deleteSale = async (sale_id: number) => {
    const result = await db
        .delete(saleTable)
        .where(eq(saleTable.device_id, sale_id))
        .returning();

    return result;
}

export const getGrossIncome = async () => {
    const income = await db
        .select({
            gross_income: sql`SUM(${saleTable.total_amount})`,
        })
        .from(saleTable);

    const debts = await db
        .select({
            total_debt: sql`SUM(${saleTable.debt_amount})`,
        })
        .from(saleTable)
        .where(eq(saleTable.debt, true));

    const incomeRow = income[0] ?? { gross_income: 0 };
    const debtsRow = debts[0] ?? { total_debt: 0 };

    incomeRow.gross_income = Number(incomeRow.gross_income) - Number(debtsRow.total_debt);
    
    if (income.length > 0){
        return incomeRow.gross_income;
    }

    return 0;
}

export const getNetIncome = async () => {
    const grossIncome = await getGrossIncome();

    const expenseDebts = await db
        .select({
            total_expenses: sql`SUM(${expenseTable.amount})`,
        })
        .from(expenseTable);

    const { total_expenses } = expenseDebts[0] ?? { total_expenses: 0 };

    const expenses = Number(total_expenses);

    return Number(grossIncome) - expenses;
}
