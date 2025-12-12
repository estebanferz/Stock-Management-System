import { db } from "@server/db/db";
import { saleTable, expenseTable, phoneTable } from "@server/db/schema.ts";
import { and, eq, sql } from "drizzle-orm"
import { normalizeShortString } from "../util/formattersBackend";

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
        eq(saleTable.is_deleted, false),
      ),
    );
    
    return result;
}

export const getAllSales = async () => {
    return await db.select().from(saleTable).where(eq(saleTable.is_deleted, false)).orderBy(sql`${saleTable.datetime} DESC`);
}

export const getSaleById = async(id: number) => {
    const sale = await db.query.saleTable.findFirst({
        where: and(
            eq(saleTable.sale_id, id), 
            eq(saleTable.is_deleted, false)),
    });
    return sale;
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
    trade_in_device?: number;
}) => {
    const normalizedSale = {
        ...newSale,
        payment_method: normalizeShortString(newSale.payment_method),
    };

    const result = await db
        .insert(saleTable)
        .values(normalizedSale)
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

export async function softDeleteSale(id: number) {
    const result = await db
        .update(saleTable)
        .set({ is_deleted: true })
        .where(eq(saleTable.sale_id, id))
        .returning();

    return result.length > 0;
}

export const getGrossIncome = async () => {
    const income = await db
        .select({
            gross_income: sql`SUM(${saleTable.total_amount})`,
        })
        .from(saleTable)
        .where(eq(saleTable.is_deleted, false));

    const debts = await db
        .select({
            total_debt: sql`SUM(${saleTable.debt_amount})`,
        })
        .from(saleTable)
        .where(and(eq(saleTable.debt, true), eq(saleTable.is_deleted, false)));

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
        .from(expenseTable)
        .where(eq(expenseTable.is_deleted, false));

    const { total_expenses } = expenseDebts[0] ?? { total_expenses: 0 };

    const expenses = Number(total_expenses);

    return Number(grossIncome) - expenses;
}

export const getSalesCountByMonth = async () => {
  
  const salesByMonth = await db
    .select({
      month_start_date: sql<string>`DATE_TRUNC('month', ${saleTable.datetime})`,
      count: sql<number>`CAST(COUNT(*) AS INTEGER)`, 
    })
    .from(saleTable)
    .where(eq(saleTable.is_deleted, false))
    .groupBy(sql`DATE_TRUNC('month', ${saleTable.datetime})`)
    .orderBy(sql`DATE_TRUNC('month', ${saleTable.datetime}) ASC`); 
    
  return salesByMonth;
};

export const getProductSoldCount = async() => {
    
    const result = await db
        .select({
            name: phoneTable.name, 
            sold_count: sql<number>`CAST(COUNT(${saleTable.device_id}) AS INTEGER)`,
        })
        .from(saleTable)
        .innerJoin(
            phoneTable, 
            eq(saleTable.device_id, phoneTable.device_id)
        )
        .where(eq(saleTable.is_deleted, false))
        .groupBy(phoneTable.name) 
        .orderBy(sql`COUNT(${saleTable.device_id}) DESC`)
        .limit(5);

    return result;
};

export const getDebts = async() => {
    const debts = await db
        .select()
        .from(saleTable)
        .where(and(eq(saleTable.debt, true), eq(saleTable.is_deleted, false)));

    console.log(debts);
    return debts;
}

export const getTotalDebt = async() => {
    const debts = await db
        .select({
            total_debt: sql`SUM(${saleTable.debt_amount})`,
        })
        .from(saleTable)
        .where(and(eq(saleTable.debt, true), eq(saleTable.is_deleted, false)));
    
    const { total_debt } = debts[0] ?? { total_debt: 0 };

    const debt = Number(total_debt);

    return Number(debt);
}