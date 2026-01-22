import { Elysia } from "elysia";
import { getFxSnapshotVenta, type Currency } from "../services/currencyService";
import { protectedController } from "../util/protectedController";
import { getGrossIncome, getNetIncome } from "../services/saleService";
import { getStockInvestment } from "../services/phoneService";
import { getDebts, getTotalDebt } from "../services/clientService";
import { getTopExpensesByCategory } from "../services/expenseService";

export const currencyController = new Elysia({ prefix: "/currency" })
    .get("/fx/latest", protectedController(async () => {
        const fx = await getFxSnapshotVenta();
        return fx;
    }))
    .get("/metrics/overview", protectedController(async (ctx) => {
        const display: Currency = ctx.tenantSettings.display_currency ?? "ARS";
        console.log("Display currency in currencyController:", display);
        const fx = await getFxSnapshotVenta();
        console.log("FX in currencyController:", fx);

        const gross = await getGrossIncome(ctx.tenantId, display, fx);
        const net = await getNetIncome(ctx.tenantId, display, fx);
        const investment = await getStockInvestment(ctx.tenantId, display, fx)
        const debtors = await getDebts(ctx.tenantId, display, fx);
        const total_debt = await getTotalDebt(ctx.tenantId, display, fx);
        const expenses = await getTopExpensesByCategory(ctx.tenantId, display, fx)

        return {
            displayCurrency: display,
            fx: { updatedAt: fx.updatedAt, isStale: fx.isStale ?? false },
            grossIncome: gross,
            netIncome: net,
            stockInvestment: investment,
            debtors: debtors,
            total_debt: total_debt,
            top_expenses: expenses,
        };
    }));