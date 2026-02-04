// server/services/signupService.ts
import { db } from "../../db/db";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";
import {
  userTable,
  // NUEVAS:
  subscriptionPlanTable,
  signupIntentTable,
} from "../../db/schema";

const ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN ?? "";
const APP_PUBLIC_URL = process.env.APP_PUBLIC_URL ?? "";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function makeIntentId() {
  return randomBytes(16).toString("hex");
}

export async function listPlans() {
  const plans = await db
    .select({
      key: subscriptionPlanTable.key,
      name: subscriptionPlanTable.name,
      price_amount: subscriptionPlanTable.price_amount,
      currency: subscriptionPlanTable.currency,
    })
    .from(subscriptionPlanTable)
    .where(eq(subscriptionPlanTable.is_active, true));

  return { ok: true, plans };
}

type StartSignupBody = {
  planKey: string;
  email: string;
  password: string;
  tenantName?: string;
};

type StartResult =
  | { ok: true; status: 200; init_point: string; intent_id: string }
  | { ok: false; status: number; message: string };

export async function startSignupCheckout(body: StartSignupBody): Promise<StartResult> {
  if (!MP_ACCESS_TOKEN) return { ok: false, status: 500, message: "MP not configured" };
  if (!APP_PUBLIC_URL) return { ok: false, status: 500, message: "APP_PUBLIC_URL missing" };

  const email = normalizeEmail(body.email);

  // 1) evitar emails ya registrados (user ya existe)
  const existing = await db.select({ user_id: userTable.user_id }).from(userTable).where(eq(userTable.email, email)).limit(1);
  if (existing.length) return { ok: false, status: 409, message: "Email already in use" };

  // 2) buscar plan
  const planRows = await db
    .select({
      plan_id: subscriptionPlanTable.plan_id,
      mp_plan_id: subscriptionPlanTable.mp_preapproval_plan_id,
      name: subscriptionPlanTable.name,
    })
    .from(subscriptionPlanTable)
    .where(eq(subscriptionPlanTable.key, body.planKey))
    .limit(1);

  const plan = planRows[0];
  if (!plan) return { ok: false, status: 404, message: "Plan not found" };

  const intentId = makeIntentId();
  const passwordHash = await hash(body.password, ROUNDS);

  const externalRef = `signup:${intentId}`;
  const backUrl = `${APP_PUBLIC_URL}/signup/return?intent=${intentId}`;

  // 3) crear intent (status=created)
  await db.insert(signupIntentTable).values({
    intent_id: intentId,
    email,
    password_hash: passwordHash,
    plan_id: plan.plan_id,
    status: "created",
    external_reference: externalRef,
    // opcional:
    // expires_at: new Date(Date.now() + 1000*60*60*24),
  });

  // 4) crear suscripción MP (preapproval con plan asociado)
  const mpRes = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      preapproval_plan_id: plan.mp_plan_id,
      payer_email: email,
      external_reference: externalRef,
      back_url: backUrl,
      reason: `Suscripción mensual - ${plan.name}`,
    }),
  });

  if (!mpRes.ok) {
    const text = await mpRes.text();
    return { ok: false, status: 502, message: `MP error: ${text}` };
  }

  const mp = await mpRes.json() as any;
  // En docs de /preapproval se usa el endpoint de suscripciones. :contentReference[oaicite:0]{index=0}
  // MP suele devolver id + init_point (según el flujo habilitado).

  const mpPreapprovalId: string | undefined = mp?.id;
  const initPoint: string | undefined = mp?.init_point;

  if (!mpPreapprovalId || !initPoint) {
    return { ok: false, status: 502, message: "MP response missing id/init_point" };
  }

  // 5) persistir mp ids
  await db
    .update(signupIntentTable)
    .set({
      status: "pending",
      mp_preapproval_id: mpPreapprovalId,
      mp_init_point: initPoint,
      updated_at: new Date(),
    })
    .where(eq(signupIntentTable.intent_id, intentId));

  return { ok: true, status: 200, init_point: initPoint, intent_id: intentId };
}

type StatusResult =
  | { ok: true; status: 200; statusValue: string }
  | { ok: false; status: number; message: string };

export async function getSignupStatus(intentId: string): Promise<StatusResult> {
  const rows = await db
    .select({ status: signupIntentTable.status })
    .from(signupIntentTable)
    .where(eq(signupIntentTable.intent_id, intentId))
    .limit(1);

  const r = rows[0];
  if (!r) return { ok: false, status: 404, message: "Intent not found" };

  return { ok: true, status: 200, statusValue: r.status };
}
