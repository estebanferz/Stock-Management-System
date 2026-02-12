import { Elysia, t } from "elysia";
import { protectedController } from "../util/protectedController";
import {
  getCurrentTenant,
  upsertTenantSettings,
  updateTenantName,
  deactivateTenant,
  patchMyTenant,
  patchMyTenantSettings,
  presignTenantLogoUpload,
  linkTenantLogo,
  getTenantLogoSignedUrl,
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
        cuit: t.Optional(t.Union([t.String({ maxLength: 32 }), t.Null()])),
        address: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        display_currency: t.Optional(t.String({ maxLength: 8 })),
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
  )
  .get(
    "/logo",
    protectedController(async (ctx) => {
      const url = await getTenantLogoSignedUrl(ctx.tenantId);
      if (!url) {
        ctx.set.status = 404;
        return;
      }
      ctx.set.status = 302;
      ctx.set.headers["Location"] = url;
      return;
    })
  )

  .post(
    "/logo/presign",
    protectedController(async (ctx) => {
      const { contentType, filename, size } = ctx.body;

      const result = await presignTenantLogoUpload(ctx.tenantId, ctx.roleInTenant, {
        contentType,
        filename,
        size,
      });

      if (!result.ok) {
        ctx.set.status = result.status;
        return { ok: false, message: result.message };
      }

      return { ok: true, key: result.key, putUrl: result.putUrl };
    }),
    {
      body: t.Object({
        contentType: t.String({ minLength: 1, maxLength: 100 }),
        filename: t.String({ minLength: 1, maxLength: 255 }),
        size: t.Integer({ minimum: 1 }),
      }),
    }
  )

  .post(
    "/logo/link",
    protectedController(async (ctx) => {
      const { key, contentType } = ctx.body;

      const result = await linkTenantLogo(ctx.tenantId, ctx.roleInTenant, { key, contentType });

      if (!result.ok) {
        ctx.set.status = result.status;
        return { ok: false, message: result.message };
      }

      return { ok: true };
    }),
    {
      body: t.Object({
        key: t.String({ minLength: 1, maxLength: 1024 }),
        contentType: t.String({ minLength: 1, maxLength: 100 }),
      }),
    }
  )
  .patch(
    "/me",
    protectedController(async (ctx) => {
      const row = await patchMyTenant(ctx.tenantId, ctx.user.id, ctx.body);
      ctx.set.status = 200;
      return row;
    }),
    {
      body: t.Object({
        name: t.Optional(t.String({ maxLength: 255 })),
      }),
      detail: { summary: "Patch my tenant (name)", tags: ["tenants"] },
    }
  )

  .patch(
    "/me/settings",
    protectedController(async (ctx) => {
      const row = await patchMyTenantSettings(ctx.tenantId, ctx.user.id, ctx.body);
      ctx.set.status = 200;
      return row;
    }),
    {
      body: t.Object({
        business_name: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        cuit: t.Optional(t.Union([t.String({ maxLength: 32 }), t.Null()])),
        address: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        display_currency: t.Optional(t.String({ maxLength: 8 })),
        timezone: t.Optional(t.String({ maxLength: 64 })),
        low_stock_threshold_default: t.Optional(t.Number()),
      }),
      detail: { summary: "Patch my tenant settings", tags: ["tenants"] },
    }
  );