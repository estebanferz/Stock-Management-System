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
import { requireAuth } from "../middlewares/requireAuth";

export const phoneController = new Elysia({ prefix: "/phone" })
  .use(requireAuth)
  .get("/", () => {
    return { message: "Phone endpoint" };
  })
  .get(
    "/all",
    async ({query, user}) => {
      const userId = user!.user_id;


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
    },
    {
      detail: {
        summary: "Get all phones in DB (scoped by user)",
        tags: ["phones"],
      },
    }
  )
  .get(
    "/:id",
    async ({params: {id}, user}) => {
      const userId = user!.user_id;
      const phoneId = Number(id);

      return await getPhoneById(userId, phoneId);
    },
    {
      detail: {
        summary: "Get phone details by ID (scoped by user)",
        tags: ["phones"],
      },
    }
  )
  .post(
    "/",
    async ({body, set, user}) => {
      const userId = user!.user_id;

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
      set.status = 201;
      return result;
    },
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
    async ({ params: {id}, body, set, user }) => {
      const userId = user!.user_id;
      const phoneId = Number(id);

      const updPhone = {
        userId,
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

      set.status = 200;
      return result;
    },
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
  .delete("/:id", async ({params: {id}, set, user}) => {
    const userId = user!.user_id;
    const phoneId = Number(id);

    const ok = await softDeletePhone(userId, phoneId);
    set.status = ok ? 200 : 404;
    return ok;
  });