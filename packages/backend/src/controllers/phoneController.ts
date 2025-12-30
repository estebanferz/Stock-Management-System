import { Elysia, t } from "elysia";
import {
  getAllPhones,
  getPhonesByFilter,
  getPhoneById,
  addPhone,
  updatePhone,
  softDeletePhone,
} from "../services/phoneService";
import { phoneInsertDTO, phoneUpdateDTO } from "@server/db/types";
import { protectedController } from "../util/protectedController";

export const phoneController = new Elysia({ prefix: "/phone" })
  .get("/", () => ({ message: "Phone endpoint" }))

  .get(
    "/all",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
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
        query.is_deleted
      ) {
        return await getPhonesByFilter(userId, {
          device: query.device,
          imei: query.imei,
          color: query.color,
          storage_capacity: query.storage_capacity,
          battery_health: query.battery_health,
          category: query.category,
          device_type: query.device_type,
          trade_in: query.trade_in,
          sold: query.sold,
          is_deleted:
            query.is_deleted === undefined ? undefined : query.is_deleted === "true",
        });
      }

      return await getAllPhones(userId);
    }),
    {
      detail: {
        summary: "Get all phones in DB (scoped by user)",
        tags: ["phones"],
      },
    }
  )

  .get(
    "/:id",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const phoneId = Number(ctx.params.id);

      return await getPhoneById(userId, phoneId);
    }),
    {
      detail: {
        summary: "Get phone details by ID (scoped by user)",
        tags: ["phones"],
      },
    }
  )

  .post(
    "/",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const body = ctx.body;

      const newPhone = {
        user_id: userId,
        datetime: new Date(body.datetime),
        name: body.name,
        brand: body.brand,
        imei: body.imei,
        device_type: body.device_type,
        ...(body.battery_health && { battery_health: body.battery_health }),
        ...(body.storage_capacity && { storage_capacity: body.storage_capacity }),
        ...(body.color && { color: body.color }),
        category: body.category,
        price: body.price,
        buy_cost: body.buy_cost,
        deposit: body.deposit,
        ...(body.sold && { sold: body.sold }),
        ...(body.trade_in && { trade_in: body.trade_in }),
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
        summary: "Insert a new phone (scoped by user)",
        tags: ["phones"],
      },
    }
  )

  .put(
    "/:id",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const phoneId = Number(ctx.params.id);
      const body = ctx.body;

      const updPhone = {
        user_id: userId, // ✅ consistente con POST (evita bugs)
        datetime: new Date(body.datetime),
        name: body.name,
        brand: body.brand,
        imei: body.imei,
        device_type: body.device_type,
        ...(body.battery_health && { battery_health: body.battery_health }),
        ...(body.storage_capacity && { storage_capacity: body.storage_capacity }),
        ...(body.color && { color: body.color }),
        category: body.category,
        price: body.price,
        buy_cost: body.buy_cost,
        deposit: body.deposit,
        ...(body.sold && { sold: body.sold }),
        ...(body.trade_in && { trade_in: body.trade_in }),
      };

      const result = await updatePhone(userId, phoneId, updPhone);

      ctx.set.status = 200;
      return result;
    }),
    {
      body: t.Object({
        ...phoneUpdateDTO.properties,
        datetime: t.String({ format: "date-time" }),
      }),
      detail: {
        summary: "Update a phone (scoped by user)",
        tags: ["phones"],
      },
    }
  )

  .delete(
    "/:id",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const phoneId = Number(ctx.params.id);

      const ok = await softDeletePhone(userId, phoneId);
      ctx.set.status = ok ? 200 : 404;
      return ok;
    })
  );
