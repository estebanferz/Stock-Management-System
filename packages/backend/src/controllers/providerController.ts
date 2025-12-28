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
import { requireAuth } from "../middlewares/requireAuth";

export const providerController = new Elysia({ prefix: "/provider" })
  .use(requireAuth)

  .get("/", () => {
    return { message: "Provider endpoint" };
  })

  .get(
    "/all",
    async (ctx) => {
      const userId = ctx.user.user_id;
      const { query } = ctx;

      const hasFilters =
        query.name || query.email || query.phone_number || query.address || query.is_deleted;

      if (hasFilters) {
        return await getProviderByFilter(userId, {
          name: query.name,
          email: query.email,
          phone_number: query.phone_number,
          address: query.address,
          is_deleted: query.is_deleted === undefined ? undefined : query.is_deleted === "true",
        });
      }

      return await getAllProviders(userId);
    },
    {
      detail: {
        summary: "Get all providers in DB (scoped by user)",
        tags: ["providers"],
      },
    }
  )

  .get(
    "/:id",
    async (ctx) => {
      const userId = ctx.user.user_id;
      const providerId = Number(ctx.params.id);

      return await getProviderById(userId, providerId);
    },
    {
      detail: {
        summary: "Get provider details by ID (scoped by user)",
        tags: ["providers"],
      },
    }
  )

  .post(
    "/",
    async (ctx) => {
      const userId = ctx.user.user_id;
      const { body, set } = ctx;

      const newProvider = {
        user_id: userId, // ✅ SIEMPRE desde backend
        name: body.name,
        phone_number: body.phone_number,
        ...(body.email && { email: body.email }),
        address: body.address,
      };

      const result = await addProvider(newProvider);
      set.status = 201;
      return result;
    },
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
    async (ctx) => {
      const userId = ctx.user.user_id;
      const providerId = Number(ctx.params.id);
      const { body, set } = ctx;

      const updProvider = {
        name: body.name,
        phone_number: body.phone_number,
        ...(body.email && { email: body.email }),
        address: body.address,
      };

      const result = await updateProvider(userId, providerId, updProvider);
      set.status = 200;
      return result;
    },
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

  .delete("/:id", async (ctx) => {
    const userId = ctx.user.user_id;
    const providerId = Number(ctx.params.id);

    const ok = await softDeleteProvider(userId, providerId);
    ctx.set.status = ok ? 200 : 404;
    return ok;
  });
