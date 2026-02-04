// server/controllers/signupController.ts
import { Elysia, t } from "elysia";
import { startSignupCheckout, getSignupStatus } from "../services/signupService";

export const signupController = new Elysia({ prefix: "/public/signup" })
  .get("/plans", async () => {
    // planes visibles en landing/signup
    // (en el service podés filtrar is_active)
    const { listPlans } = await import("../services/signupService");
    return await listPlans();
  }, {
    detail: { summary: "List subscription plans", tags: ["public"] }
  })
  .post("/start", async ({ body, set }) => {
    const result = await startSignupCheckout(body);

    if (!result.ok) {
      set.status = result.status;
      return { ok: false, message: result.message };
    }

    return { ok: true, init_point: result.init_point, intent_id: result.intent_id };
  }, {
    body: t.Object({
      planKey: t.String({ minLength: 1, maxLength: 64 }),
      email: t.String({ minLength: 5, maxLength: 255 }),
      password: t.String({ minLength: 8, maxLength: 200 }),
      tenantName: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
    }),
    detail: { summary: "Start signup + MP subscription flow", tags: ["public"] }
  })
  .get("/status", async ({ query, set }) => {
    const intentId = typeof query.intent === "string" ? query.intent : undefined;
    if (!intentId) {
      set.status = 400;
      return { ok: false, message: "Missing intent" };
    }

    const result = await getSignupStatus(intentId);
    if (!result.ok) {
      set.status = result.status;
      return { ok: false, message: result.message };
    }

    return { ok: true, status: result.statusValue };
  }, {
    detail: { summary: "Get signup intent status", tags: ["public"] }
  });
