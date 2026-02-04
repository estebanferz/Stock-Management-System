import { Elysia, t } from "elysia";
import { parseMpWebhook, verifyMpSignatureOrThrow, makeEventId } from "../lib/mpWebhook";
import { processMpWebhookEvent } from "../services/mpWebhookService";
import { createHash } from "node:crypto";


export const mpWebhookController = new Elysia({ prefix: "/webhooks" })
  .post(
    "/mercadopago",
    async (ctx) => {
      const parsed = parseMpWebhook(ctx);
      if (!parsed) {
        ctx.set.status = 200;
        return { ok: true };
      }

      // ✅ Validación opcional (solo si configuraste secret)
      // En MP se habla de "secret signature"; hay implementaciones que usan x-signature/x-request-id + data.id
      // Si no querés lidiar con esto ahora, dejá MP_WEBHOOK_SECRET vacío y listo. :contentReference[oaicite:3]{index=3}
      try {
        verifyMpSignatureOrThrow(parsed, process.env.MP_WEBHOOK_SECRET);
      } catch (e) {
        // Si activaste secret y falla, devolvé 401 para no aceptar falsos positivos
        if (process.env.MP_WEBHOOK_SECRET) {
          ctx.set.status = 401;
          return { ok: false, error: "INVALID_SIGNATURE" };
        }
      }

      const reqId = parsed.xRequestId ?? "";
      const eventId = createHash("sha256")
        .update(`${reqId}:${parsed.topic}:${parsed.resourceId}`)
        .digest("hex");

      // Guardamos el payload tal cual para auditoría
      const rawPayload = {
        body: ctx.body,
        query: ctx.query,
        headers: {
          "x-request-id": parsed.xRequestId,
          "x-signature": parsed.xSignature,
        },
      };

      // Procesar (idempotente)
      try {
        await processMpWebhookEvent(parsed, rawPayload, eventId);
      } catch (e) {
        // MP reintenta si no devuelves 200. Ojo:
        // - si hubo error transitorio (DB caida), conviene NO responder 200.
        // - si es error por dato faltante, podés responder 200 para evitar spam.
        //
        // Para empezar: devolvemos 500 para que reintente.
        ctx.set.status = 500;
        return { ok: false, error: "WEBHOOK_PROCESSING_FAILED" };
      }

      ctx.set.status = 200;
      return { ok: true };
    },
    {
      body: t.Any(),
      detail: { summary: "Mercado Pago webhook (subscriptions)", tags: ["mercadopago"] },
    }
  );
