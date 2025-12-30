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
import { requireAuth } from "../middlewares/requireAuth";


export const clientController = new Elysia({ prefix: "/client" })
  .use(requireAuth)

  .get("/", () => {
    return { message: "Client endpoint" };
  })

  .get(
    "/all",
    async ({ query, user}) => {
      const userId = user!.user_id;

      if (
        query.name ||
        query.id_number ||
        query.email ||
        query.phone_number ||
        query.is_deleted
      ) {
        let is_deleted: boolean | undefined = undefined;
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
    },
    {
      detail: {
        summary: "Get all clients in DB (scoped by user)",
        tags: ["clients"],
      },
    }
  )

  .get(
    "/:id",
    async ({params: {id}, user}) => {
      const userId = user!.user_id;

      return await getClientById(userId, Number(id));
    },
    {
      detail: {
        summary: "Get client details by ID (scoped by user)",
        tags: ["clients"],
      },
    }
  )

  .post(
    "/",
    async ({ body, set, user }) => {
      const userId = user!.user_id;

      const newClient = {
        user_id: userId,
        name: body.name,
        id_number: Number(body.id_number),
        ...(body.email && { email: body.email }),
        ...(body.phone_number && { phone_number: body.phone_number }),
        ...(body.birth_date && { birth_date: body.birth_date }),
        ...(body.debt && { debt: body.debt }),
      };

      console.log("[client.post] ctx.user:", user);
      console.log("[client.post] userId:", userId, typeof userId);
      console.log("[client.post] newClient:", newClient);

      const result = await addClient(newClient);
      set.status = 201;
      return result;
    },
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
    async ({ body, params: { id }, set, user }) => {
      const userId = user!.user_id;

      const updClient = {
        user_id: userId,
        name: body.name,
        id_number: Number(body.id_number),
        ...(body.email && { email: body.email }),
        ...(body.phone_number && { phone_number: body.phone_number }),
        ...(body.birth_date && { birth_date: body.birth_date }),
        ...(body.debt && { debt: body.debt }),
      };

      const result = await updateClient(userId, Number(id), updClient);

      set.status = 200;
      return result;
    },
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

  .delete("/:id", async ({params: {id}, user, set}) => {
    const userId = user!.user_id;

    const ok = await softDeleteClient(userId, Number(id));

    set.status = ok ? 200 : 404;
    return ok;
  })

  .get(
    "/debts",
    async ({ user }) => {
      const userId = user!.user_id;
      return await getDebts(userId);
    },
    {
      detail: {
        summary: "Get all debts (scoped by user)",
        tags: ["sales"],
      },
    }
  )

  .get(
    "/total-debt",
    async ({ user }) => {
      const userId = user!.user_id;
      return await getTotalDebt(userId);
    },
    {
      detail: {
        summary: "Get total debt amount (scoped by user)",
        tags: ["sales"],
      },
    }
  );
