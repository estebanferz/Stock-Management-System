import { Elysia, t } from "elysia";
import {
  getAllClients,
  getClientByFilter,
  getClientById,
  updateClient,
  addClient,
  softDeleteClient,
  getDebts,
  getTotalDebt,
} from "../services/clientService";
import { clientInsertDTO, clientUpdateDTO } from "@server/db/types";
import { protectedController } from "../util/protectedController";

export const clientController = new Elysia({ prefix: "/client" })
  .get("/", () => ({ message: "Client endpoint" }))

  .get(
    "/all",
    protectedController(async (ctx) => {
      const { query, user } = ctx;
      const userId = user.id;

      if (
        query.name ||
        query.id_number ||
        query.email ||
        query.phone_number ||
        query.is_deleted
      ) {
        let is_deleted: boolean | undefined;
        if (query.is_deleted !== undefined) {
          is_deleted = query.is_deleted === "true";
        }

        return await getClientByFilter(
          userId,
          query.name,
          query.id_number,
          query.email,
          query.phone_number,
          is_deleted
        );
      }

      return await getAllClients(userId);
    }),
    {
      detail: {
        summary: "Get all clients in DB (scoped by user)",
        tags: ["clients"],
      },
    }
  )

  .get(
    "/:id",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      return await getClientById(userId, Number(ctx.params.id));
    }),
    {
      detail: {
        summary: "Get client details by ID (scoped by user)",
        tags: ["clients"],
      },
    }
  )

  .post(
    "/",
    protectedController(async (ctx) => {
      const { body, set, user } = ctx;
      const userId = user.id;

      const newClient = {
        user_id: userId,
        name: body.name,
        id_number: Number(body.id_number),
        ...(body.email && { email: body.email }),
        ...(body.phone_number && { phone_number: body.phone_number }),
        ...(body.birth_date && { birth_date: body.birth_date }),
        ...(body.debt && { debt: body.debt }),
      };

      const result = await addClient(newClient);
      set.status = 201;
      return result;
    }),
    {
      body: t.Object({
        ...clientInsertDTO.properties,
        id_number: t.String(),
      }),
      detail: {
        summary: "Insert a new client (scoped by user)",
        tags: ["clients"],
      },
    }
  )

  .put(
    "/:id",
    protectedController(async (ctx) => {
      const { body, set, user } = ctx;
      const userId = user.id;

      const updClient = {
        user_id: userId,
        name: body.name,
        id_number: Number(body.id_number),
        ...(body.email && { email: body.email }),
        ...(body.phone_number && { phone_number: body.phone_number }),
        ...(body.birth_date && { birth_date: body.birth_date }),
        ...(body.debt && { debt: body.debt }),
      };

      const result = await updateClient(userId, Number(ctx.params.id), updClient);
      set.status = 200;
      return result;
    }),
    {
      body: t.Object({
        ...clientUpdateDTO.properties,
        id_number: t.String(),
      }),
      detail: {
        summary: "Update a client (scoped by user)",
        tags: ["clients"],
      },
    }
  )

  .delete(
    "/:id",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const ok = await softDeleteClient(userId, Number(ctx.params.id));
      ctx.set.status = ok ? 200 : 404;
      return ok;
    })
  )

  .get(
    "/debts",
    protectedController(async (ctx) => {
      return await getDebts(ctx.user.id);
    }),
    {
      detail: {
        summary: "Get all debts (scoped by user)",
        tags: ["sales"],
      },
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
