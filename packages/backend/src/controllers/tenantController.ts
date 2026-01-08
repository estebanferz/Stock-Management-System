import { Elysia, t } from "elysia";
import { protectedController } from "../util/protectedController";
import {
  getCurrentTenant,
  upsertTenantSettings,
  updateTenantName,
  deactivateTenant,
} from "../services/tenantService";

export const tenantController = new Elysia({ prefix: "/tenant" })
  .get("/", () => ({ message: "Tenant endpoint" }))

  .get(
    "/current",
    protectedController(async (ctx) => {
      return await getCurrentTenant(ctx.tenantId);
    }),
    {
      detail: {
        summary: "Get current tenant + settings (scoped by session/tenant)",
        tags: ["tenants"],
      },
    }
  )

  .put(
    "/current",
    protectedController(async (ctx) => {
      const result = await upsertTenantSettings(ctx.tenantId, ctx.roleInTenant, ctx.body);
      ctx.set.status = 200;
      return result;
    }),
    {
      body: t.Object({
        business_name: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        logo_url: t.Optional(t.Union([t.String({ maxLength: 1024 }), t.Null()])),
        cuit: t.Optional(t.Union([t.String({ maxLength: 32 }), t.Null()])),
        address: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),

        default_currency: t.Optional(t.String({ maxLength: 8 })),
        timezone: t.Optional(t.String({ maxLength: 64 })),
        low_stock_threshold_default: t.Optional(t.Number({ minimum: 0, maximum: 100000 })),
      }),
      detail: {
        summary: "Upsert tenant settings (owner/admin only)",
        tags: ["tenants"],
      },
    }
  )

  .put(
    "/name",
    protectedController(async (ctx) => {
      const result = await updateTenantName(ctx.tenantId, ctx.roleInTenant, ctx.body.name);
      ctx.set.status = 200;
      return result;
    }),
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
      }),
      detail: {
        summary: "Update tenant name (owner/admin only)",
        tags: ["tenants"],
      },
    }
  )

  .delete(
    "/current",
    protectedController(async (ctx) => {
      const ok = await deactivateTenant(ctx.tenantId, ctx.roleInTenant);
      ctx.set.status = ok ? 200 : 404;
      return ok;
    }),
    {
      detail: {
        summary: "Deactivate tenant (soft) + revoke all tenant sessions (owner only)",
        tags: ["tenants"],
      },
    }
  );
