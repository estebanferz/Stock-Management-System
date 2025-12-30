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
import { requireAuth } from "../middlewares/requireAuth";

export const technicianController = new Elysia({ prefix: "/technician" })
  .use(requireAuth)

  .get("/", () => {
    return { message: "Technician endpoint" };
  })

  .get(
    "/all",
    async ({query, user}) => {
      const userId = user!.user_id;

      const hasFilters =
        query.name ||
        query.speciality ||
        query.state ||
        query.email ||
        query.phone_number ||
        query.is_deleted;

      if (hasFilters) {
        return await getTechniciansByFilter(userId, {
          name: query.name,
          speciality: query.speciality,
          state: query.state,
          email: query.email,
          phone_number: query.phone_number,
          is_deleted: query.is_deleted === undefined ? undefined : query.is_deleted === "true",
        });
      }

      return await getAllTechnicians(userId);
    },
    {
      detail: {
        summary: "Get all technicians in DB (scoped by user)",
        tags: ["technicians"],
      },
    }
  )

  .get(
    "/:id",
    async ({params: {id}, user}) => {
      const userId = user!.user_id;
      const techId = Number(id);
      return await getTechnicianById(userId, techId);
    },
    {
      detail: {
        summary: "Get technician details by ID (scoped by user)",
        tags: ["technicians"],
      },
    }
  )

  .post(
    "/",
    async ({ body, set, user }) => {
      const userId = user!.user_id;

      const newTechnician = {
        user_id: userId,
        name: body.name,
        ...(body.email && { email: body.email }),
        ...(body.phone_number && { phone_number: body.phone_number }),
        speciality: body.speciality,
        state: body.state,
      };

      const result = await addTechnician(userId, newTechnician);
      set.status = 201;
      return result;
    },
    {
      body: t.Object({
        ...technicianInsertDTO.properties,
      }),
      detail: {
        summary: "Insert a new technician (scoped by user)",
        tags: ["technicians"],
      },
    }
  )

  .put(
    "/:id",
    async ({params: {id}, body, set, user}) => {
      const userId = user!.user_id;
      const techId = Number(id);

      const updTechnician = {
        name: body.name,
        ...(body.email && { email: body.email }),
        ...(body.phone_number && { phone_number: body.phone_number }),
        speciality: body.speciality,
        state: body.state,
      };

      const result = await updateTechnician(userId, techId, updTechnician);
      set.status = 200;
      return result;
    },
    {
      body: t.Object({
        ...technicianUpdateDTO.properties,
      }),
      detail: {
        summary: "Update a technician (scoped by user)",
        tags: ["technicians"],
      },
    }
  )

  .delete("/:id", async ({params: {id}, set, user}) => {
    const userId = user!.user_id;
    const techId = Number(id);

    const ok = await softDeleteTechnician(userId, techId);
    set.status = ok ? 200 : 404;
    return ok;
  });
