import { Elysia, t } from "elysia";
import { protectedController } from "../util/protectedController";
import { getBillingStatus, createSubscriptionForTenant, cancelSubscriptionForTenant } from "../services/billingService";

const DEFAULT_PLAN_KEY = "pro";

export const billingController = new Elysia({ prefix: "/billing" })
    .get(
    "/status",
    protectedController(async (ctx) => {
        const data = await getBillingStatus(ctx.tenantId);
        return { ok: true, ...data };
        }),
        { detail: { summary: "Billing status", tags: ["billing"] } }
    )
  .post(
    "/subscription",
    protectedController(async (ctx) => {
      const planKey = ctx.body?.planKey ?? DEFAULT_PLAN_KEY;
      const cardTokenId = ctx.body.cardTokenId;

      const backUrl =
        process.env.APP_BILLING_RETURN_URL ??
        "http://localhost:4321/dashboard/billing?mp=return";

      const result = await createSubscriptionForTenant(
        ctx.tenantId,
        ctx.user.email,
        planKey,
        backUrl,
        cardTokenId,
      );
      if (!result.ok) {
        ctx.set.status = result.status;
        return { ok: false, message: result.message };
      }

      return {
        ok: true,
        preapproval_id: result.preapproval_id,
        init_point: result.init_point,
      };
    }),
    {
      body: t.Object({
        planKey: t.Optional(t.String({ minLength: 1, maxLength: 64 })),
        cardTokenId: t.String({ minLength: 10 }),
      }),
      detail: { summary: "Create MP subscription (card token)", tags: ["billing"] },
    }
  )
  .post(
    "/cancel",
    protectedController(async (ctx) => {
      const role = ctx.roleInTenant;
      if (role !== "owner" && role !== "admin") {
        ctx.set.status = 403;
        return { ok: false, message: "No autorizado para cancelar la suscripción." };
      }

      const result = await cancelSubscriptionForTenant(ctx.tenantId);
      if (!result.ok) {
        ctx.set.status = result.status;
        return { ok: false, message: result.message };
      }
      return result;
    }),
    { detail: { summary: "Cancel MP subscription", tags: ["billing"] } }
  );
