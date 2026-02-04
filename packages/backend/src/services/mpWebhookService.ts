import { db } from "@server/db/db";
import {
  mpEventTable,
  tenantSettingsTable,
  subscriptionPlanTable,
  signupIntentTable,
} from "@server/db/schema";
import { eq } from "drizzle-orm";
import { mpGet } from "../lib/mpClient";
import type { MpWebhookParsed } from "../lib/mpWebhook";

type MpPreapproval = {
  id: string;
  status?: string; // e.g. "authorized", "pending", "paused", "cancelled" (varía)
  external_reference?: string | null;
  payer_email?: string | null;
  next_payment_date?: string | null; // suele venir en respuesta (ISO)
  auto_recurring?: {
    start_date?: string | null;
  };
};

function mapMpStatusToLocal(mpStatus?: string | null) {
  const s = (mpStatus ?? "").toLowerCase();

  // MP statuses suelen incluir: authorized, pending, paused, cancelled
  // (pueden variar según país/versión; mantenemos mapeo tolerante)
  if (s === "authorized" || s === "active") return "active";
  if (s === "pending") return "pending";
  if (s === "paused") return "past_due";
  if (s === "cancelled" || s === "canceled") return "canceled";

  // fallback conservador
  return "pending";
}

function parseExternalRef(ext?: string | null) {
  if (!ext) return null;

  // tenant flow recomendado antes: `tenant:<id>:plan:<key>`
  if (ext.startsWith("tenant:")) {
    const parts = ext.split(":");
    const tenantId = Number(parts[1]);
    const planKey = parts[3] || null;
    if (Number.isFinite(tenantId)) return { kind: "tenant" as const, tenantId, planKey };
  }

  // signup intent (si lo querés usar más adelante): `signup:<intent_id>`
  if (ext.startsWith("signup:")) {
    const intentId = ext.slice("signup:".length);
    if (intentId) return { kind: "signup" as const, intentId };
  }

  return { kind: "unknown" as const, raw: ext };
}

export async function processMpWebhookEvent(parsed: MpWebhookParsed, rawPayload: any, eventId: string) {
  const now = new Date();

  // 1) idempotencia fuerte: insert mp_event; si ya existe, salimos
  const inserted = await db
    .insert(mpEventTable)
    .values({
      mp_event_id: eventId,
      topic: parsed.topic,
      resource_id: parsed.resourceId,
      payload: rawPayload,
      received_at: now,
    })
    .onConflictDoNothing()
    .returning({ mp_event_id: mpEventTable.mp_event_id });

  if (!inserted.length) {
    // ya procesado / recibido
    return { ok: true, dedup: true };
  }

  // 2) Solo procesamos preapproval (suscripciones). Otros topics se registran y listo.
  const topicLower = (parsed.topic ?? "").toLowerCase();
  const isPreapproval =
    topicLower.includes("preapproval") || topicLower === "subscription_preapproval" || topicLower === "preapproval";

  if (!isPreapproval || parsed.resourceId === "unknown") {
    await db.update(mpEventTable).set({ processed_at: now }).where(eq(mpEventTable.mp_event_id, eventId));
    return { ok: true, ignored: true };
  }

  // 3) Fuente de verdad: GET /preapproval/:id
  const pre = await mpGet<MpPreapproval>(`/preapproval/${parsed.resourceId}`);

  const localStatus = mapMpStatusToLocal(pre.status);
  const ext = parseExternalRef(pre.external_reference);

  // 4) Aplicar cambios según external_reference
  if (ext?.kind === "tenant") {
    // si podemos, resolvemos plan_id por planKey
    let planId: number | null = null;
    if (ext.planKey) {
      const [plan] = await db
        .select({ plan_id: subscriptionPlanTable.plan_id })
        .from(subscriptionPlanTable)
        .where(eq(subscriptionPlanTable.key, ext.planKey))
        .limit(1);
      planId = plan?.plan_id ?? null;
    }

    const nextPayment = pre.next_payment_date ? new Date(pre.next_payment_date) : null;
    const startAt = pre.auto_recurring?.start_date ? new Date(pre.auto_recurring.start_date) : null;

    // ✅ update tenant_settings
    await db
      .update(tenantSettingsTable)
      .set({
        subscription_status: localStatus as any,
        subscription_plan_id: planId ?? undefined,
        mp_preapproval_id: pre.id,
        subscription_started_at: localStatus === "active" ? now : undefined,
        current_period_end: nextPayment ?? undefined,
        last_mp_event_at: now,
      })
      .where(eq(tenantSettingsTable.tenant_id, ext.tenantId));

    // set tenant_id en mp_event (útil para auditoría)
    await db
      .update(mpEventTable)
      .set({ tenant_id: ext.tenantId, processed_at: now })
      .where(eq(mpEventTable.mp_event_id, eventId));

    return { ok: true, applied: true, tenantId: ext.tenantId, status: localStatus };
  }

  if (ext?.kind === "signup") {
    // Esto es opcional por si más adelante haces “pago antes de crear tenant”
    if (localStatus === "active") {
      await db
        .update(signupIntentTable)
        .set({ status: "approved", approved_at: now, mp_preapproval_id: pre.id })
        .where(eq(signupIntentTable.intent_id, ext.intentId));

      await db
        .update(mpEventTable)
        .set({ intent_id: ext.intentId, processed_at: now })
        .where(eq(mpEventTable.mp_event_id, eventId));
    } else {
      await db.update(mpEventTable).set({ intent_id: ext.intentId, processed_at: now }).where(eq(mpEventTable.mp_event_id, eventId));
    }

    return { ok: true, applied: true, intentId: ext.intentId, status: localStatus };
  }

  // unknown reference → solo marcamos procesado
  await db.update(mpEventTable).set({ processed_at: now }).where(eq(mpEventTable.mp_event_id, eventId));
  return { ok: true, applied: false, status: localStatus };
}
