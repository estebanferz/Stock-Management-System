import { Elysia, t } from "elysia";
import {
  getAllSales,
  getSaleByFilter,
  getSaleById,
  addSale,
  updateSale,
  softDeleteSale,
  getGrossIncome,
  getNetIncome,
  getSalesByMonth,
  getProductSoldCount,
  getDebts,
  getTotalDebt,
  getNetIncomeBreakdown,
  getSalesOverviewMetrics,
  getSalesPublicOverviewWithMonthSeries,
} from "../services/saleService";
import { saleInsertDTO, saleUpdateDTO, type Currency } from "@server/db/types";
import { protectedController } from "../util/protectedController";
import { getFxSnapshotVenta } from "../services/currencyService";

export const saleController = new Elysia({ prefix: "/sale" })
  .get("/", () => ({ message: "Sale endpoint" }))

  .get(
    "/all",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const query = ctx.query;

      if (query.date || query.client_id || query.seller_id || query.device_id || query.is_deleted) {
        return await getSaleByFilter(tenantId, {
          date: query.date,
          client_id: query.client_id,
          seller_id: query.seller_id,
          device_id: query.device_id,
          is_deleted: query.is_deleted === undefined ? undefined : query.is_deleted === "true",
        });
      }

      return await getAllSales(tenantId);
    }),
    {
      detail: {
        summary: "Get all sales in DB (scoped by tenant)",
        tags: ["sales"],
      },
    }
  )

  .get(
    "/:id",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const saleId = Number(ctx.params.id);
      return await getSaleById(tenantId, saleId);
    }),
    {
      detail: {
        summary: "Get sale details by ID (scoped by tenant)",
        tags: ["sales"],
      },
    }
  )

  .post(
    "/",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const body = ctx.body;

      if (body.trade_in_device && body.trade_in_phone) {
        ctx.set.status = 400;
        return { error: "TRADE_IN_CONFLICT" };
      }

      const newSale = {
        datetime: body.datetime ? new Date(body.datetime) : undefined,
        total_amount: body.total_amount,
        currency: body.currency,
        payment_method: body.payment_method,
        debt: body.debt,
        ...(body.debt_amount && { debt_amount: body.debt_amount }),
        client_id: body.client_id,
        seller_id: body.seller_id,
        device_id: body.device_id,
        trade_in_phone: body.trade_in_phone ?? undefined,
        ...(body.trade_in_device && { trade_in_device: body.trade_in_device }),
        gift_accessories: body.gift_accessories ?? [],

      };

      try {
        const result = await addSale(tenantId, newSale);
        ctx.set.status = 201;
        return result;
      } catch (err: any) {
        const msg = err?.message;
        if (
          msg === "INVALID_CLIENT" ||
          msg === "INVALID_SELLER" ||
          msg === "INVALID_DEVICE" ||
          msg === "INVALID_TRADE_IN"
        ) {
          ctx.set.status = 400;
          return { error: msg };
        }
        if (msg === "SALE_NOT_FOUND") {
          ctx.set.status = 404;
          return { error: msg };
        }
        throw err;
      }
    }),
    {
      body: saleInsertDTO,
      detail: {
        summary: "Insert a new sale (scoped by tenant)",
        tags: ["sales"],
      },
    }
  )

  .put(
    "/:id",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const saleId = Number(ctx.params.id);
      const body = ctx.body;

      const updSale = {
        datetime: body.datetime ? new Date(body.datetime) : undefined,
        total_amount: body.total_amount,
        currency: body.currency,
        payment_method: body.payment_method,
        debt: body.debt,
        ...(body.debt_amount && { debt_amount: body.debt_amount }),
        client_id: body.client_id,
        seller_id: body.seller_id,
        device_id: body.device_id,
        ...(body.trade_in_device && { trade_in_device: body.trade_in_device }),
      };

      try {
        const result = await updateSale(tenantId, saleId, updSale);
        ctx.set.status = 200;
        return result;
      } catch (err: any) {
        const msg = err?.message;
        if (
          msg === "INVALID_CLIENT" ||
          msg === "INVALID_SELLER" ||
          msg === "INVALID_DEVICE" ||
          msg === "INVALID_TRADE_IN"
        ) {
          ctx.set.status = 400;
          return { error: msg };
        }
        if (msg === "SALE_NOT_FOUND") {
          ctx.set.status = 404;
          return { error: msg };
        }
        throw err;
      }
    }),
    {
      body: saleUpdateDTO,
      detail: {
        summary: "Update a sale (scoped by tenant)",
        tags: ["sales"],
      },
    }
  )

  .delete(
    "/:id",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const saleId = Number(ctx.params.id);

      const ok = await softDeleteSale(tenantId, saleId);
      ctx.set.status = ok ? 200 : 404;
      return ok;
    })
  )
  .get(
    "/net-income",
    protectedController(async (ctx) => {
      const display: Currency = ctx.tenantSettings.display_currency ?? "ARS";
      const fx = await getFxSnapshotVenta();
      return await getNetIncome(ctx.tenantId, display, fx);
    }),
    {
      detail: { summary: "Get net income (scoped by tenant)", tags: ["sales"] },
    }
  )

  .get(
    "/sales-by-month",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const year = Number(ctx.query.year);

      if (!year || Number.isNaN(year)) {
        ctx.set.status = 400;
        return { ok: false, message: "Invalid year" };
      }

      return await getSalesByMonth(tenantId, year);
    }),
    {
      query: t.Object({ year: t.String() }),
      detail: {
        summary: "Get sales grouped by month for a given year (scoped by tenant)",
        tags: ["sales"],
      },
    }
  )

  .get(
    "/products-sold-count",
    protectedController(async (ctx) => {
      return await getProductSoldCount(ctx.tenantId);
    }),
    {
      detail: {
        summary: "Get products sold count (scoped by tenant)",
        tags: ["sales"],
      },
    }
  )

  .get(
    "/debts",
    protectedController(async (ctx) => {
      return await getDebts(ctx.tenantId);
    }),
    {
      detail: { summary: "Get all debts (scoped by tenant)", tags: ["sales"] },
    }
  )

  .get(
    "/total-debt",
    protectedController(async (ctx) => {
      return await getTotalDebt(ctx.tenantId);
    }),
    {
      detail: {
        summary: "Get total debt amount (scoped by tenant)",
        tags: ["sales"],
      },
    }
  )
  .get(
    "/net-income-breakdown",
    protectedController(async (ctx) => {
      const display: Currency = ctx.tenantSettings.display_currency ?? "ARS";
      const fx = await getFxSnapshotVenta();
      return await getNetIncomeBreakdown(ctx.tenantId, display, fx);
    }),
    {
      detail: {
        summary: "Net income breakdown by sale",
        tags: ["sales"],
      },
    }
  )
  .get(
  "/metrics/overview",
  protectedController(async (ctx) => {
    const display: Currency = ctx.tenantSettings.display_currency ?? "ARS";
    const fx = await getFxSnapshotVenta();
    return await getSalesPublicOverviewWithMonthSeries(ctx.tenantId, display, fx);
  }),    
  {
      detail: {
        summary: "Public sales metrics overview (staff + owner)",
        tags: ["sales", "metrics"],
      },
    }
);
