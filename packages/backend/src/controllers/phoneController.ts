import { Elysia, t } from "elysia";
import {
  getAllPhones,
  getPhonesByFilter,
  getPhoneById,
  addPhone,
  updatePhone,
  softDeletePhone,
  getStockInvestment,
  getStockInvestmentBreakdown,
} from "../services/phoneService";
import { phoneInsertDTO, phoneUpdateDTO, type Currency } from "@server/db/types";
import { protectedController } from "../util/protectedController";
import { getFxSnapshotVenta } from "../services/currencyService";

export const phoneController = new Elysia({ prefix: "/phone" })
  .get("/", () => ({ message: "Phone endpoint" }))

  .get(
    "/all",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const query = ctx.query;

      if (
        query.device ||
        query.imei ||
        query.color ||
        query.storage_capacity ||
        query.battery_health ||
        query.category ||
        query.device_type ||
        query.trade_in ||
        query.sold ||
        query.is_deleted ||
        query.in_repair
      ) {
        return await getPhonesByFilter(tenantId, {
          device: query.device,
          imei: query.imei,
          color: query.color,
          storage_capacity: query.storage_capacity,
          battery_health: query.battery_health,
          category: query.category,
          device_type: query.device_type,
          trade_in: query.trade_in,
          sold: query.sold,
          in_repair: query.in_repair,
          is_deleted: query.is_deleted === undefined ? undefined : query.is_deleted === "true",
        });
      }

      return await getAllPhones(tenantId);
    }),
    {
      detail: {
        summary: "Get all phones in DB (scoped by tenant)",
        tags: ["phones"],
      },
    }
  )

  .get(
    "/:id",
    protectedController(async (ctx) => {
      const phoneId = Number(ctx.params.id);
      return await getPhoneById(ctx.tenantId, phoneId);
    }),
    {
      detail: {
        summary: "Get phone details by ID (scoped by tenant)",
        tags: ["phones"],
      },
    }
  )

  .post(
    "/",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const body = ctx.body;

      const newPhone = {
        tenant_id: tenantId,
        datetime: new Date(body.datetime),
        name: body.name,
        brand: body.brand,
        imei: body.imei,
        device_type: body.device_type,
        ...(body.battery_health !== undefined && { battery_health: body.battery_health }),
        ...(body.storage_capacity !== undefined && { storage_capacity: body.storage_capacity }),
        ...(body.color && { color: body.color }),
        category: body.category,
        price: body.price,
        currency_sale: body.currency_sale,
        buy_cost: body.buy_cost,
        currency_buy: body.currency_buy,
        deposit: body.deposit,
        ...(body.sold !== undefined && { sold: body.sold }),
        ...(body.trade_in !== undefined && { trade_in: body.trade_in }),
      };

      const result = await addPhone(newPhone);
      ctx.set.status = 201;
      return result;
    }),
    {
      body: t.Object({
        ...phoneInsertDTO.properties,
        datetime: t.String({ format: "date-time" }),
      }),
      detail: {
        summary: "Insert a new phone (scoped by tenant)",
        tags: ["phones"],
      },
    }
  )

  .put(
    "/:id",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const phoneId = Number(ctx.params.id);
      const body = ctx.body;

      const updPhone = {
        datetime: new Date(body.datetime),
        name: body.name,
        brand: body.brand,
        imei: body.imei,
        device_type: body.device_type,
        ...(body.battery_health !== undefined && { battery_health: body.battery_health }),
        ...(body.storage_capacity !== undefined && { storage_capacity: body.storage_capacity }),
        ...(body.color && { color: body.color }),
        category: body.category,
        price: body.price,
        currency_sale: body.currency_sale,
        buy_cost: body.buy_cost,
        currency_buy: body.currency_buy,
        deposit: body.deposit,
        ...(body.sold !== undefined && { sold: body.sold }),
        ...(body.trade_in !== undefined && { trade_in: body.trade_in }),
      };

      const result = await updatePhone(tenantId, phoneId, updPhone);

      ctx.set.status = 200;
      return result;
    }),
    {
      body: t.Object({
        ...phoneUpdateDTO.properties,
        datetime: t.String({ format: "date-time" }),
      }),
      detail: {
        summary: "Update a phone (scoped by tenant)",
        tags: ["phones"],
      },
    }
  )

  .delete(
    "/:id",
    protectedController(async (ctx) => {
      const phoneId = Number(ctx.params.id);

      const ok = await softDeletePhone(ctx.tenantId, phoneId);
      ctx.set.status = ok ? 200 : 404;
      return ok;
    })
  )
  .get("/stock-investment", protectedController(async (ctx) => {
    const display: Currency = ctx.tenantSettings.display_currency ?? "ARS";
    const fx = await getFxSnapshotVenta();
    return await getStockInvestment(ctx.tenantId, display, fx);
  }))
  .get("/stock-investment-breakdown", protectedController(async (ctx) => {
    return await getStockInvestmentBreakdown(ctx.tenantId);
  }));