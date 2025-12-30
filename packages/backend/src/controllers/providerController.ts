import { Elysia, t } from "elysia";
import {
  getAllProviders,
  getProviderByFilter,
  getProviderById,
  addProvider,
  updateProvider,
  softDeleteProvider,
} from "../services/providerService";
import { providerInsertDTO, providerUpdateDTO } from "@server/db/types";
import { protectedController } from "../util/protectedController";

export const providerController = new Elysia({ prefix: "/provider" })
  .get("/", () => ({ message: "Provider endpoint" }))

  .get(
    "/all",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const query = ctx.query;

      const hasFilters =
        query.name ||
        query.email ||
        query.phone_number ||
        query.address ||
        query.is_deleted;

      if (hasFilters) {
        return await getProviderByFilter(userId, {
          name: query.name,
          email: query.email,
          phone_number: query.phone_number,
          address: query.address,
          is_deleted:
            query.is_deleted === undefined ? undefined : query.is_deleted === "true",
        });
      }

      return await getAllProviders(userId);
    }),
    {
      detail: {
        summary: "Get all providers in DB (scoped by user)",
        tags: ["providers"],
      },
    }
  )

  .get(
    "/:id",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const providerId = Number(ctx.params.id);

      return await getProviderById(userId, providerId);
    }),
    {
      detail: {
        summary: "Get provider details by ID (scoped by user)",
        tags: ["providers"],
      },
    }
  )

  .post(
    "/",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const body = ctx.body;

      const newProvider = {
        user_id: userId,
        name: body.name,
        phone_number: body.phone_number,
        ...(body.email && { email: body.email }),
        address: body.address,
      };

      const result = await addProvider(newProvider);
      ctx.set.status = 201;
      return result;
    }),
    {
      body: t.Object({
        ...providerInsertDTO.properties,
      }),
      detail: {
        summary: "Insert a new provider (scoped by user)",
        tags: ["providers"],
      },
    }
  )

  .put(
    "/:id",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const providerId = Number(ctx.params.id);
      const body = ctx.body;

      const updProvider = {
        name: body.name,
        phone_number: body.phone_number,
        ...(body.email && { email: body.email }),
        address: body.address,
      };

      const result = await updateProvider(userId, providerId, updProvider);
      ctx.set.status = 200;
      return result;
    }),
    {
      body: t.Object({
        ...providerUpdateDTO.properties,
      }),
      detail: {
        summary: "Update a provider (scoped by user)",
        tags: ["providers"],
      },
    }
  )

  .delete(
    "/:id",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const providerId = Number(ctx.params.id);

      const ok = await softDeleteProvider(userId, providerId);
      ctx.set.status = ok ? 200 : 404;
      return ok;
    })
  );
