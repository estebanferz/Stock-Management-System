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
  getClientOverviewMetrics,
} from "../services/clientService";
import { clientInsertDTO, clientUpdateDTO, type Currency } from "@server/db/types";
import { protectedController } from "../util/protectedController";
import { getFxSnapshotVenta } from "../services/currencyService";

export const clientController = new Elysia({ prefix: "/client" })
  .get("/", () => ({ message: "Client endpoint" }))

  .get(
    "/all",
    protectedController(async (ctx) => {
      const { query, tenantId } = ctx;

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
          tenantId,
          query.name,
          query.id_number,
          query.email,
          query.phone_number,
          is_deleted
        );
      }

      return await getAllClients(tenantId);
    }),
    {
      detail: {
        summary: "Get all clients in DB (scoped by tenant)",
        tags: ["clients"],
      },
    }
  )

  .get(
    "/:id",
    protectedController(async (ctx) => {
      return await getClientById(ctx.tenantId, Number(ctx.params.id));
    }),
    {
      detail: {
        summary: "Get client details by ID (scoped by tenant)",
        tags: ["clients"],
      },
    }
  )

  .post(
    "/",
    protectedController(async (ctx) => {
      const { body, set } = ctx;

      const newClient = {
        tenant_id: ctx.tenantId,
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
        id_number: t.String(), // vos lo estás mandando como string
      }),
      detail: {
        summary: "Insert a new client (scoped by tenant)",
        tags: ["clients"],
      },
    }
  )

  .put(
    "/:id",
    protectedController(async (ctx) => {
      const { body, set } = ctx;

      const updClient = {
        name: body.name,
        id_number: Number(body.id_number),
        ...(body.email && { email: body.email }),
        ...(body.phone_number && { phone_number: body.phone_number }),
        ...(body.birth_date && { birth_date: body.birth_date }),
        ...(body.debt && { debt: body.debt }),
      };

      const result = await updateClient(ctx.tenantId, Number(ctx.params.id), updClient);
      set.status = 200;
      return result;
    }),
    {
      body: t.Object({
        ...clientUpdateDTO.properties,
        id_number: t.String(),
      }),
      detail: {
        summary: "Update a client (scoped by tenant)",
        tags: ["clients"],
      },
    }
  )

  .delete(
    "/:id",
    protectedController(async (ctx) => {
      const ok = await softDeleteClient(ctx.tenantId, Number(ctx.params.id));
      ctx.set.status = ok ? 200 : 404;
      return ok;
    })
  )

  .get(
    "/debts",
    protectedController(async (ctx) => {
      const display: Currency = ctx.tenantSettings.display_currency ?? "ARS";
      const fx = await getFxSnapshotVenta();
      return await getDebts(ctx.tenantId, display, fx);
    }),
    {
      detail: {
        summary: "Get all debts (scoped by tenant)",
        tags: ["sales"],
      },
    }
  )

  .get(
    "/total-debt",
    protectedController(async (ctx) => {
      const display: Currency = ctx.tenantSettings.display_currency ?? "ARS";
      const fx = await getFxSnapshotVenta();
      return await getTotalDebt(ctx.tenantId, display, fx);
    }),
    {
      detail: {
        summary: "Get total debt amount (scoped by tenant)",
        tags: ["sales"],
      },
    }
  )
  .get(
    "/metrics/overview",
    protectedController(async (ctx) => {
      const display: Currency = ctx.tenantSettings.display_currency ?? "ARS";
      const fx = await getFxSnapshotVenta();
      const tenantId = ctx.tenantId;
      const { limit } = ctx.query as any;

      return await getClientOverviewMetrics(tenantId, {
        limit: limit ? Number(limit) : 5,
      }, display, fx);
    }),
    {
      detail: {
        summary: "Clients overview metrics (debt count, total debt, top clients)",
        tags: ["clients", "metrics"],
      },
    }
  );
