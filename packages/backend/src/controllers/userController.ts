import { Elysia, t } from "elysia";
import { protectedController } from "../util/protectedController";
import {
  getMyUser,
  upsertMyUserSettings,
  deactivateMyUser,
} from "../services/userService";

export const userController = new Elysia({ prefix: "/user" })
  .get("/", () => ({ message: "User endpoint" }))

  .get(
    "/me",
    protectedController(async (ctx) => {
      return await getMyUser(ctx.tenantId, ctx.user.id);
    }),
    {
      detail: {
        summary: "Get my user info + settings (scoped by tenant via session)",
        tags: ["users"],
      },
    }
  )

  .put(
    "/me",
    protectedController(async (ctx) => {
      const result = await upsertMyUserSettings(ctx.tenantId, ctx.user.id, ctx.body);
      ctx.set.status = 200;
      return result;
    }),
    {
      body: t.Object({
        display_name: t.Optional(t.Union([t.String({ maxLength: 120 }), t.Null()])),
        phone: t.Optional(t.Union([t.String({ maxLength: 32 }), t.Null()])),
        email_notifications: t.Optional(t.Boolean()),
      }),
      detail: {
        summary: "Upsert my user settings",
        tags: ["users"],
      },
    }
  )

  .delete(
    "/me",
    protectedController(async (ctx) => {
      const ok = await deactivateMyUser(ctx.tenantId, ctx.user.id);
      ctx.set.status = ok ? 200 : 404;
      return ok;
    }),
    {
      detail: {
        summary: "Deactivate my user (soft) and revoke sessions in this tenant",
        tags: ["users"],
      },
    }
  );
