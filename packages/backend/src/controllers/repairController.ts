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
      const tenantId = ctx.tenantId;
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
        return await getRepairsByFilter(tenantId, {
          date: query.date,
          repair_state: query.repair_state,
          priority: query.priority,
          client_id: query.client_id,
          technician_id: query.technician_id,
          device_id: query.device_id,
          cost_min: query.cost_min,
          cost_max: query.cost_max,
          is_deleted: query.is_deleted === undefined ? undefined : query.is_deleted === "true",
        });
      }

      return await getAllRepairs(tenantId);
    }),
    {
      detail: {
        summary: "Get all repairs in DB (scoped by tenant)",
        tags: ["repairs"],
      },
    }
  )

  .post(
    "/",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const body = ctx.body;

      const newRepair = {
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

      try {
        const result = await addRepair(tenantId, newRepair);
        ctx.set.status = 201;
        return result;
      } catch (err: any) {
        if (
          err?.message === "INVALID_CLIENT" ||
          err?.message === "INVALID_TECHNICIAN" ||
          err?.message === "INVALID_DEVICE"
        ) {
          ctx.set.status = 400;
          return { error: err.message };
        }
        throw err;
      }
    }),
    {
      body: t.Object({
        ...repairInsertDTO.properties,
        datetime: t.String({ format: "date-time" }),
      }),
      detail: {
        summary: "Insert a new repair (scoped by tenant)",
        tags: ["repairs"],
      },
    }
  )

  .put(
    "/:id",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
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

      try {
        const result = await updateRepair(tenantId, repairId, updRepair);
        ctx.set.status = 200;
        return result;
      } catch (err: any) {
        if (
          err?.message === "INVALID_CLIENT" ||
          err?.message === "INVALID_TECHNICIAN" ||
          err?.message === "INVALID_DEVICE"
        ) {
          ctx.set.status = 400;
          return { error: err.message };
        }
        throw err;
      }
    }),
    {
      body: t.Object({
        ...repairUpdateDTO.properties,
        datetime: t.String({ format: "date-time" }),
      }),
      detail: {
        summary: "Update a repair (scoped by tenant)",
        tags: ["repairs"],
      },
    }
  )

  .delete(
    "/:id",
    protectedController(async (ctx) => {
      const repairId = Number(ctx.params.id);

      const ok = await softDeleteRepair(ctx.tenantId, repairId);
      ctx.set.status = ok ? 200 : 404;
      return ok;
    })
  );
