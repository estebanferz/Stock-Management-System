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
import { requireAuth } from "../middlewares/requireAuth";

export const saleController = new Elysia({ prefix: "/sale" })
  .use(requireAuth)

  .get("/", () => {
    return { message: "Sale endpoint" };
  })

  .get(
    "/all",
    async ({query, user}) => {
      const userId = user!.user_id;

      if (query.date || query.client_id || query.seller_id || query.device_id || query.is_deleted) {
        return await getSaleByFilter(userId, {
          date: query.date,
          client_id: query.client_id,
          seller_id: query.seller_id,
          device_id: query.device_id,
          is_deleted: query.is_deleted === undefined ? undefined : query.is_deleted === "true",
        });
      }

      return await getAllSales(userId);
    },
    {
      detail: {
        summary: "Get all sales in DB (scoped by user)",
        tags: ["sales"],
      },
    }
  )

  .get(
    "/:id",
    async ({params: {id}, user}) => {
      const userId = user!.user_id;
      const saleId = Number(id);
      return await getSaleById(userId, saleId);
    },
    {
      detail: {
        summary: "Get sale details by ID (scoped by user)",
        tags: ["sales"],
      },
    }
  )

  .post(
    "/",
    async ({ body, set, user }) => {
      const userId = user!.user_id;

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
      set.status = 201;
      return result;
    },
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
    async ({ params: {id}, body, set, user }) => {
      const userId = user!.user_id;
      const saleId = Number(id);

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
      set.status = 200;
      return result;
    },
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

  .delete("/:id", async ({params: {id}, set, user}) => {
    const userId = user!.user_id;
    const saleId = Number(id);

    const ok = await softDeleteSale(userId, saleId);
    set.status = ok ? 200 : 404;
    return ok;
  })

  .get(
    "/gross-income",
    async ({user}) => {
      const userId = user!.user_id;
      return await getGrossIncome(userId);
    },
    {
      detail: { summary: "Get gross income (scoped by user)", tags: ["sales"] },
    }
  )

  .get(
    "/net-income",
    async ({user}) => {
      const userId = user!.user_id;
      return await getNetIncome(userId);
    },
    {
      detail: { summary: "Get net income (scoped by user)", tags: ["sales"] },
    }
  )

  .get(
    "/sales-by-month",
    async ({query, user, set}) => {
      const userId = user!.user_id;
      const year = Number(query.year);

      if (!year || isNaN(year)) {
        set.status = 400;
        return { ok: false, message: "Invalid year" };
      }

      return await getSalesByMonth(userId, year);
    },
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
    async ({user}) => {
      const userId = user!.user_id;
      return await getProductSoldCount(userId);
    },
    {
      detail: { summary: "Get products sold count (scoped by user)", tags: ["sales"] },
    }
  )

  .get(
    "/debts",
    async ({user}) => {
      const userId = user!.user_id;
      return await getDebts(userId);
    },
    {
      detail: { summary: "Get all debts (scoped by user)", tags: ["sales"] },
    }
  )

  .get(
    "/total-debt",
    async ({user}) => {
      const userId = user!.user_id;
      return await getTotalDebt(userId);
    },
    {
      detail: { summary: "Get total debt amount (scoped by user)", tags: ["sales"] },
    }
  );
