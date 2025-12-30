import { Elysia, t } from "elysia";
import {
  getRepairsByFilter,
  getAllRepairs,
  addRepair,
  updateRepair,
  softDeleteRepair,
} from "../services/repairService";
import { repairInsertDTO, repairUpdateDTO } from "@server/db/types";
import { protectedController } from "../util/protectedController";

export const repairController = new Elysia({ prefix: "/repair" })
  .get("/", () => ({ message: "Repair endpoint" }))

  .get(
    "/all",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const query = ctx.query;

      if (
        query.date ||
        query.repair_state ||
        query.priority ||
        query.client_id ||
        query.technician_id ||
        query.device_id ||
        query.cost_min ||
        query.cost_max ||
        query.is_deleted
      ) {
        return await getRepairsByFilter(userId, {
          date: query.date,
          repair_state: query.repair_state,
          priority: query.priority,
          client_id: query.client_id,
          technician_id: query.technician_id,
          device_id: query.device_id,
          cost_min: query.cost_min,
          cost_max: query.cost_max,
          is_deleted:
            query.is_deleted === undefined
              ? undefined
              : query.is_deleted === "true",
        });
      }

      return await getAllRepairs(userId);
    }),
    {
      detail: {
        summary: "Get all repairs in DB (scoped by user)",
        tags: ["repairs"],
      },
    }
  )

  .post(
    "/",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const body = ctx.body;

      const newRepair = {
        user_id: userId,
        datetime: body.datetime ? new Date(body.datetime) : undefined,
        repair_state: body.repair_state,
        priority: body.priority,
        description: body.description,
        ...(body.diagnostic && { diagnostic: body.diagnostic }),
        client_cost: body.client_cost,
        internal_cost: body.internal_cost,
        client_id: body.client_id,
        technician_id: body.technician_id,
        device_id: body.device_id,
      };

      const result = await addRepair(userId, newRepair);
      ctx.set.status = 201;
      return result;
    }),
    {
      body: t.Object({
        ...repairInsertDTO.properties,
        datetime: t.String({ format: "date-time" }),
      }),
      detail: {
        summary: "Insert a new repair (scoped by user)",
        tags: ["repairs"],
      },
    }
  )

  .put(
    "/:id",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const repairId = Number(ctx.params.id);
      const body = ctx.body;

      const updRepair = {
        datetime: body.datetime ? new Date(body.datetime) : undefined,
        repair_state: body.repair_state,
        priority: body.priority,
        description: body.description,
        ...(body.diagnostic && { diagnostic: body.diagnostic }),
        client_cost: body.client_cost,
        internal_cost: body.internal_cost,
        client_id: body.client_id,
        technician_id: body.technician_id,
        device_id: body.device_id,
      };

      const result = await updateRepair(userId, repairId, updRepair);
      ctx.set.status = 200;
      return result;
    }),
    {
      body: t.Object({
        ...repairUpdateDTO.properties,
        datetime: t.String({ format: "date-time" }),
      }),
      detail: {
        summary: "Update a repair (scoped by user)",
        tags: ["repairs"],
      },
    }
  )

  .delete(
    "/:id",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const repairId = Number(ctx.params.id);

      const ok = await softDeleteRepair(userId, repairId);
      ctx.set.status = ok ? 200 : 404;
      return ok;
    })
  );
