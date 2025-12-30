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
} from "../services/saleService";
import { saleInsertDTO, saleUpdateDTO } from "@server/db/types";
import { protectedController } from "../util/protectedController";

export const saleController = new Elysia({ prefix: "/sale" })
  .get("/", () => ({ message: "Sale endpoint" }))

  .get(
    "/all",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const query = ctx.query;

      if (
        query.date ||
        query.client_id ||
        query.seller_id ||
        query.device_id ||
        query.is_deleted
      ) {
        return await getSaleByFilter(userId, {
          date: query.date,
          client_id: query.client_id,
          seller_id: query.seller_id,
          device_id: query.device_id,
          is_deleted:
            query.is_deleted === undefined ? undefined : query.is_deleted === "true",
        });
      }

      return await getAllSales(userId);
    }),
    {
      detail: {
        summary: "Get all sales in DB (scoped by user)",
        tags: ["sales"],
      },
    }
  )

  .get(
    "/:id",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const saleId = Number(ctx.params.id);
      return await getSaleById(userId, saleId);
    }),
    {
      detail: {
        summary: "Get sale details by ID (scoped by user)",
        tags: ["sales"],
      },
    }
  )

  .post(
    "/",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const body = ctx.body;

      const newSale = {
        user_id: userId,
        datetime: body.datetime ? new Date(body.datetime) : undefined,
        total_amount: body.total_amount,
        payment_method: body.payment_method,
        debt: body.debt,
        ...(body.debt_amount && { debt_amount: body.debt_amount }),
        client_id: body.client_id,
        seller_id: body.seller_id,
        device_id: body.device_id,
        ...(body.trade_in_device && { trade_in_device: body.trade_in_device }),
      };

      const result = await addSale(userId, newSale);
      ctx.set.status = 201;
      return result;
    }),
    {
      body: t.Object({
        ...saleInsertDTO.properties,
        datetime: t.Optional(t.String({ format: "date-time" })),
      }),
      detail: {
        summary: "Insert a new sale (scoped by user)",
        tags: ["sales"],
      },
    }
  )

  .put(
    "/:id",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const saleId = Number(ctx.params.id);
      const body = ctx.body;

      const updSale = {
        datetime: body.datetime ? new Date(body.datetime) : undefined,
        total_amount: body.total_amount,
        payment_method: body.payment_method,
        debt: body.debt,
        ...(body.debt_amount && { debt_amount: body.debt_amount }),
        client_id: body.client_id,
        seller_id: body.seller_id,
        device_id: body.device_id,
        ...(body.trade_in_device && { trade_in_device: body.trade_in_device }),
      };

      const result = await updateSale(userId, saleId, updSale);
      ctx.set.status = 200;
      return result;
    }),
    {
      body: t.Object({
        ...saleUpdateDTO.properties,
        datetime: t.Optional(t.String({ format: "date-time" })),
      }),
      detail: {
        summary: "Update a sale (scoped by user)",
        tags: ["sales"],
      },
    }
  )

  .delete(
    "/:id",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const saleId = Number(ctx.params.id);

      const ok = await softDeleteSale(userId, saleId);
      ctx.set.status = ok ? 200 : 404;
      return ok;
    })
  )

  .get(
    "/gross-income",
    protectedController(async (ctx) => {
      return await getGrossIncome(ctx.user.id);
    }),
    {
      detail: { summary: "Get gross income (scoped by user)", tags: ["sales"] },
    }
  )

  .get(
    "/net-income",
    protectedController(async (ctx) => {
      return await getNetIncome(ctx.user.id);
    }),
    {
      detail: { summary: "Get net income (scoped by user)", tags: ["sales"] },
    }
  )

  .get(
    "/sales-by-month",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const year = Number(ctx.query.year);

      if (!year || Number.isNaN(year)) {
        ctx.set.status = 400;
        return { ok: false, message: "Invalid year" };
      }

      return await getSalesByMonth(userId, year);
    }),
    {
      query: t.Object({ year: t.String() }),
      detail: {
        summary: "Get sales grouped by month for a given year (scoped by user)",
        tags: ["sales"],
      },
    }
  )

  .get(
    "/products-sold-count",
    protectedController(async (ctx) => {
      return await getProductSoldCount(ctx.user.id);
    }),
    {
      detail: {
        summary: "Get products sold count (scoped by user)",
        tags: ["sales"],
      },
    }
  )

  .get(
    "/debts",
    protectedController(async (ctx) => {
      return await getDebts(ctx.user.id);
    }),
    {
      detail: { summary: "Get all debts (scoped by user)", tags: ["sales"] },
    }
  )

  .get(
    "/total-debt",
    protectedController(async (ctx) => {
      return await getTotalDebt(ctx.user.id);
    }),
    {
      detail: {
        summary: "Get total debt amount (scoped by user)",
        tags: ["sales"],
      },
    }
  );
