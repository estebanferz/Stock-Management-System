import { Elysia, t } from "elysia";
import {
  getAllTechnicians,
  getTechnicianById,
  addTechnician,
  updateTechnician,
  softDeleteTechnician,
  getTechniciansByFilter,
} from "../services/technicianService";
import { technicianInsertDTO, technicianUpdateDTO } from "@server/db/types";
import { protectedController } from "../util/protectedController";

export const technicianController = new Elysia({ prefix: "/technician" })
  .get("/", () => ({ message: "Technician endpoint" }))

  .get(
    "/all",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const query = ctx.query;

      const hasFilters =
        query.name ||
        query.speciality ||
        query.state ||
        query.email ||
        query.phone_number ||
        query.is_deleted;

      if (hasFilters) {
        return await getTechniciansByFilter(tenantId, {
          name: query.name,
          speciality: query.speciality,
          state: query.state,
          email: query.email,
          phone_number: query.phone_number,
          is_deleted:
            query.is_deleted === undefined ? undefined : query.is_deleted === "true",
        });
      }

      return await getAllTechnicians(tenantId);
    }),
    {
      detail: {
        summary: "Get all technicians in DB (scoped by tenant)",
        tags: ["technicians"],
      },
    }
  )

  .get(
    "/:id",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const techId = Number(ctx.params.id);
      return await getTechnicianById(tenantId, techId);
    }),
    {
      detail: {
        summary: "Get technician details by ID (scoped by tenant)",
        tags: ["technicians"],
      },
    }
  )

  .post(
    "/",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const body = ctx.body;

      const newTechnician = {
        tenant_id: tenantId,
        name: body.name,
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone_number !== undefined && { phone_number: body.phone_number }),
        speciality: body.speciality,
        state: body.state,
      };

      const result = await addTechnician(tenantId, newTechnician);
      ctx.set.status = 201;
      return result;
    }),
    {
      body: t.Object({
        ...technicianInsertDTO.properties,
      }),
      detail: {
        summary: "Insert a new technician (scoped by tenant)",
        tags: ["technicians"],
      },
    }
  )

  .put(
    "/:id",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const techId = Number(ctx.params.id);
      const body = ctx.body;

      const updTechnician = {
        name: body.name,
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone_number !== undefined && { phone_number: body.phone_number }),
        speciality: body.speciality,
        state: body.state,
      };

      const result = await updateTechnician(tenantId, techId, updTechnician);
      ctx.set.status = 200;
      return result;
    }),
    {
      body: t.Object({
        ...technicianUpdateDTO.properties,
      }),
      detail: {
        summary: "Update a technician (scoped by tenant)",
        tags: ["technicians"],
      },
    }
  )

  .delete(
    "/:id",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const techId = Number(ctx.params.id);

      const ok = await softDeleteTechnician(tenantId, techId);
      ctx.set.status = ok ? 200 : 404;
      return ok;
    })
  );
