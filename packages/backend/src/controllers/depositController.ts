import { Elysia, t } from "elysia";
import { protectedController } from "../util/protectedController";
import {
  getAllDeposits,
  getDepositById,
  addDeposit,
  updateDeposit,
  softDeleteDeposit,
  getDepositsWithStock,
} from "../services/depositService";

export const depositController = new Elysia({ prefix: "/deposit" })
  
  // Endpoint para el carrusel (con conteo de stock)
  .get(
    "/all",
    protectedController(async (ctx) => {
      return await getDepositsWithStock(ctx.tenantId);
    }),
    {
      detail: {
        summary: "Get all deposits with product count",
        tags: ["deposits"],
      },
    }
  )

  .get(
    "/:id",
    protectedController(async (ctx) => {
      return await getDepositById(ctx.tenantId, Number(ctx.params.id));
    }),
    {
      detail: { tags: ["deposits"] }
    }
  )

  .post(
    "/",
    protectedController(async (ctx) => {
      const { body, set, tenantId } = ctx;
      const result = await addDeposit({
        tenant_id: tenantId,
        name: body.name,
        address: body.address,
      });
      set.status = 201;
      return result;
    }),
    {
      body: t.Object({
        name: t.String(),
        address: t.Optional(t.String()),
      }),
      detail: { tags: ["deposits"] }
    }
  )

  .put(
    "/:id",
    protectedController(async (ctx) => {
      const { body, tenantId, params } = ctx;
      return await updateDeposit(tenantId, Number(params.id), body);
    }),
    {
      body: t.Object({
        name: t.Optional(t.String()),
        address: t.Optional(t.String()),
      }),
      detail: { tags: ["deposits"] }
    }
  )

  .delete(
    "/:id",
    protectedController(async (ctx) => {
      const ok = await softDeleteDeposit(ctx.tenantId, Number(ctx.params.id));
      ctx.set.status = ok ? 200 : 404;
      return ok;
    }),
    {
      detail: { tags: ["deposits"] }
    }
  );