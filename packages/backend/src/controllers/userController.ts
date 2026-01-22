import { Elysia, t } from "elysia";
import { protectedController } from "../util/protectedController";
import {
  getMyUser,
  patchMyUserSettings,
  replaceMyUserSettings,
  resetMyUserSettings,
  deactivateMyUser,
} from "../services/userService";

export const userController = new Elysia({ prefix: "/user" })
  .get(
    "/me",
    protectedController(async (ctx) => {
      return await getMyUser(ctx.tenantId, ctx.user.id);
    }),
    {
      detail: { summary: "Get my user info + settings", tags: ["users"] },
    }
  )

  // PATCH (parcial, no pisa undefined)
  .patch(
    "/me/settings",
    protectedController(async (ctx) => {
      const row = await patchMyUserSettings(ctx.tenantId, ctx.user.id, ctx.body);
      ctx.set.status = 200;
      return row;
    }),
    {
      body: t.Object({
        display_name: t.Optional(t.Union([t.String({ maxLength: 120 }), t.Null()])),
        phone: t.Optional(t.Union([t.String({ maxLength: 32 }), t.Null()])),
        email_notifications: t.Optional(t.Boolean()),
      }),
      detail: { summary: "Patch my user settings", tags: ["users"] },
    }
  )

  // PUT (reemplazo completo)
  .put(
    "/me/settings",
    protectedController(async (ctx) => {
      const row = await replaceMyUserSettings(ctx.tenantId, ctx.user.id, ctx.body);
      ctx.set.status = 200;
      return row;
    }),
    {
      body: t.Object({
        display_name: t.Union([t.String({ maxLength: 120 }), t.Null()]),
        phone: t.Union([t.String({ maxLength: 32 }), t.Null()]),
        email_notifications: t.Boolean(),
      }),
      detail: { summary: "Replace my user settings", tags: ["users"] },
    }
  )

  // DELETE settings (reset)
  .delete(
    "/me/settings",
    protectedController(async (ctx) => {
      const deleted = await resetMyUserSettings(ctx.tenantId, ctx.user.id);
      ctx.set.status = deleted ? 200 : 404;
      return deleted;
    }),
    {
      detail: { summary: "Delete/reset my user settings", tags: ["users"] },
    }
  )

  // DELETE user (desactivar cuenta en el tenant + revocar sesiones)
  .delete(
    "/me",
    protectedController(async (ctx) => {
      const ok = await deactivateMyUser(ctx.tenantId, ctx.user.id);
      ctx.set.status = ok ? 200 : 404;
      return ok;
    }),
    {
      detail: { summary: "Deactivate my user and revoke sessions for this tenant", tags: ["users"] },
    }
  );
