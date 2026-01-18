import { Elysia, t } from "elysia";
import { protectedController } from "../util/protectedController";
import {
  getAllAccessories,
  getAccessoriesByFilter,
  getAccessoryById,
  addAccessory,
  updateAccessory,
  softDeleteAccessory,
  getAccessoryStockInvestment,
  getAccessoryStockInvestmentBreakdown,
  adjustAccessoryStock,
} from "../services/accessoryService";
import { accessoryInsertDTO, accessoryUpdateDTO } from "@server/db/types";

export const accessoryController = new Elysia({ prefix: "/accessory" })
  .get("/", () => ({ message: "Accessory endpoint" }))

  .get(
    "/all",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const query = ctx.query;

      if (
        query.name ||
        query.brand ||
        query.category ||
        query.color ||
        query.deposit ||
        query.gift ||
        query.is_deleted
      ) {
        return await getAccessoriesByFilter(tenantId, {
          name: query.name,
          brand: query.brand,
          category: query.category,
          color: query.color,
          deposit: query.deposit,
          gift:
            query.gift === undefined ? undefined : query.gift === "true",
          is_deleted:
            query.is_deleted === undefined ? undefined : query.is_deleted === "true",
        });
      }

      return await getAllAccessories(tenantId);
    }),
    {
      detail: {
        summary: "Get all accessories in DB (scoped by tenant)",
        tags: ["accessories"],
      },
    }
  )

  .get(
    "/:id",
    protectedController(async (ctx) => {
      const accessoryId = Number(ctx.params.id);
      return await getAccessoryById(ctx.tenantId, accessoryId);
    }),
    {
      detail: {
        summary: "Get accessory details by ID (scoped by tenant)",
        tags: ["accessories"],
      },
    }
  )

  .post(
    "/",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const body = ctx.body;

      const newAccessory = {
        tenant_id: tenantId,
        datetime: new Date(body.datetime),
        name: body.name,
        brand: body.brand,
        stock: body.stock ?? 0,
        ...(body.color && { color: body.color }),
        category: body.category,
        price: body.price,
        buy_cost: body.buy_cost,
        deposit: body.deposit,
        gift: body.gift ?? false,
      };

      const result = await addAccessory(newAccessory);
      ctx.set.status = 201;
      return result;
    }),
    {
      body: t.Object({
        ...accessoryInsertDTO.properties,
        datetime: t.String({ format: "date-time" }),
      }),
      detail: {
        summary: "Insert a new accessory (scoped by tenant)",
        tags: ["accessories"],
      },
    }
  )

  .put(
    "/:id",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const accessoryId = Number(ctx.params.id);
      const body = ctx.body;

      const updAccessory = {
        datetime: new Date(body.datetime),
        name: body.name,
        brand: body.brand,
        stock: body.stock,
        ...(body.color !== undefined && { color: body.color }),
        category: body.category,
        price: body.price,
        buy_cost: body.buy_cost,
        deposit: body.deposit,
        gift: body.gift,
      };

      const result = await updateAccessory(tenantId, accessoryId, updAccessory);
      ctx.set.status = 200;
      return result;
    }),
    {
      body: t.Object({
        ...accessoryUpdateDTO.properties,
        datetime: t.String({ format: "date-time" }),
      }),
      detail: {
        summary: "Update an accessory (scoped by tenant)",
        tags: ["accessories"],
      },
    }
  )
  .patch(
    "/:id/stock",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const accessoryId = Number(ctx.params.id);
      const { delta } = ctx.body;

      const result = await adjustAccessoryStock(tenantId, accessoryId, delta);

      if (!result) {
        ctx.set.status = delta < 0 ? 409 : 404;
        return {
          ok: false,
          message:
            delta < 0
              ? "Stock insuficiente o accesorio inexistente"
              : "Accesorio inexistente",
        };
      }

      ctx.set.status = 200;
      return { ok: true, ...result };
    }),
    {
      body: t.Object({
        delta: t.Integer(),
      }),
      detail: {
        summary: "Adjust accessory stock by delta (scoped by tenant)",
        tags: ["accessories"],
      },
    }
  )
  .delete(
    "/:id",
    protectedController(async (ctx) => {
      const accessoryId = Number(ctx.params.id);

      const ok = await softDeleteAccessory(ctx.tenantId, accessoryId);
      ctx.set.status = ok ? 200 : 404;
      return ok;
    })
  )

  .get(
    "/stock-investment",
    protectedController(async (ctx) => {
      return await getAccessoryStockInvestment(ctx.tenantId);
    }),
    {
      detail: {
        summary: "Get accessories stock investment (sum buy_cost * stock) scoped by tenant",
        tags: ["accessories"],
      },
    }
  )

  .get(
    "/stock-investment-breakdown",
    protectedController(async (ctx) => {
      return await getAccessoryStockInvestmentBreakdown(ctx.tenantId);
    }),
    {
      detail: {
        summary: "Get accessories stock investment breakdown (grouped) scoped by tenant",
        tags: ["accessories"],
      },
    }
  );
