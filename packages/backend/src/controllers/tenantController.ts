import { Elysia, t } from "elysia";
import { protectedController } from "../util/protectedController";
import {
  getCurrentTenant,
  upsertTenantSettings,
  updateTenantName,
  deactivateTenant,
  patchMyTenant,
  patchMyTenantSettings,
} from "../services/tenantService";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOADS_DIR = path.join(import.meta.dir, "../../uploads");

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
  )
  .post(
    "/logo",
    protectedController(async (ctx) => {
      try {
        const file = (ctx.body as any)?.file as File | undefined;
        console.log("content-type:", ctx.request.headers.get("content-type"));
        console.log("ctx.body:", ctx.body);

        if (!(file instanceof File)) {
          ctx.set.status = 400;
          return { ok: false, error: "Missing file" };
        }

        const maxBytes = 5 * 1024 * 1024; // 5MB
        if (file.size > maxBytes) {
          ctx.set.status = 400;
          return { ok: false, error: "File too large (max 5MB)" };
        }

        const allowed = new Set(["image/png", "image/jpeg", "image/webp"]);
        if (!allowed.has(file.type)) {
          ctx.set.status = 400;
          return { ok: false, error: "Invalid type (png/jpg/webp only)" };
        }

        const ext =
          file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";

        const dir = path.join(UPLOADS_DIR, "logos", "tenants", String(ctx.tenantId));
        await mkdir(dir, { recursive: true });

        const filename = `logo.${ext}`;
        const absPath = path.join(dir, filename);

        const bytes = new Uint8Array(await file.arrayBuffer());
        await writeFile(absPath, bytes);

        const publicUrl = `/api/uploads/logos/tenants/${ctx.tenantId}/${filename}?v=${Date.now()}`;

        await upsertTenantSettings(ctx.tenantId, ctx.roleInTenant, { logo_url: publicUrl });

        ctx.set.status = 200;
        return { ok: true, logo_url: publicUrl };
      } catch (err: any) {
        console.error("[tenant/logo] error:", err);

        if (String(err?.message).includes("FORBIDDEN")) {
          ctx.set.status = 403;
          return { ok: false, error: "FORBIDDEN" };
        }

        ctx.set.status = 500;
        return { ok: false, error: "INTERNAL_ERROR", detail: err?.message ?? String(err) };
      }
    })
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

  // PATCH tenant_settings
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
        logo_url: t.Optional(t.Union([t.String({ maxLength: 1024 }), t.Null()])),
        cuit: t.Optional(t.Union([t.String({ maxLength: 32 }), t.Null()])),
        address: t.Optional(t.Union([t.String({ maxLength: 255 }), t.Null()])),
        display_currency: t.Optional(t.String({ maxLength: 8 })),
        timezone: t.Optional(t.String({ maxLength: 64 })),
        low_stock_threshold_default: t.Optional(t.Number()),
      }),
      detail: { summary: "Patch my tenant settings", tags: ["tenants"] },
    }
  );