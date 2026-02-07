import { db } from "@server/db/db";
import { subscriptionPlanTable, tenantSettingsTable } from "@server/db/schema";
import { eq } from "drizzle-orm";

type MpMe = {
  id: number;
  site_id: string;
  email?: string;
};
type MpPreapprovalPlan = {
  id: string;
  collector_id: number;
  site_id: string;
  auto_recurring?: {
    currency_id?: string;
  };
};

async function mpGetRaw<T = any>(path: string): Promise<{
  ok: boolean;
  status: number;
  json: any;
}> {
  const r = await fetch(`https://api.mercadopago.com${path}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  const json = await r.json().catch(() => ({} as T));
  return { ok: r.ok, status: r.status, json };
}

export async function getBillingStatus(tenantId: number) {
  const [ts] = await db
    .select({
      subscription_status: tenantSettingsTable.subscription_status,
      trial_ends_at: tenantSettingsTable.trial_ends_at,
      subscription_plan_id: tenantSettingsTable.subscription_plan_id,
      mp_preapproval_id: tenantSettingsTable.mp_preapproval_id,
      current_period_end: tenantSettingsTable.current_period_end,
    })
    .from(tenantSettingsTable)
    .where(eq(tenantSettingsTable.tenant_id, tenantId))
    .limit(1);

  const plans = await db
    .select({
      plan_id: subscriptionPlanTable.plan_id,
      key: subscriptionPlanTable.key,
      name: subscriptionPlanTable.name,
      price_amount: subscriptionPlanTable.price_amount,
      currency: subscriptionPlanTable.currency,
      is_active: subscriptionPlanTable.is_active,
    })
    .from(subscriptionPlanTable)
    .where(eq(subscriptionPlanTable.is_active, true));

  return {
    tenant: ts ?? null,
    plans,
    now: new Date().toISOString(),
  };
}

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
if (!MP_ACCESS_TOKEN) throw new Error("Missing MP_ACCESS_TOKEN");

type MpPreapprovalCreateResp = {
  id: string;
  init_point?: string;
  status?: string;
};

async function mpPost<T>(path: string, body: any): Promise<T> {
  const r = await fetch(`https://api.mercadopago.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error("[MP] POST failed", { path, status: r.status, json });
    throw new Error(`MP POST ${path} failed (${r.status}): ${JSON.stringify(json)}`);
  }
  return json as T;
}
export async function createSubscriptionForTenant(
  tenantId: number,
  payerEmail: string,
  planKey: string,
  backUrl: string,
  cardTokenId?: string

): Promise<
  | { ok: true; status: 200; init_point: string; preapproval_id: string; subscription_status: "pending" }
  | { ok: false; status: number; message: string }
> {
  // backUrl válido
  try {
    const u = new URL(backUrl);
    if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("bad protocol");
  } catch {
    return { ok: false, status: 400, message: `Invalid backUrl: "${backUrl}"` };
  }

  // 0) chequear tenant settings actual (idempotencia)
  const [ts] = await db
    .select({
      subscription_status: tenantSettingsTable.subscription_status,
      mp_preapproval_id: tenantSettingsTable.mp_preapproval_id,
      trial_ends_at: tenantSettingsTable.trial_ends_at,
    })
    .from(tenantSettingsTable)
    .where(eq(tenantSettingsTable.tenant_id, tenantId))
    .limit(1);

  const currentStatus = (ts?.subscription_status ?? "inactive") as any;

  if (currentStatus === "active") {
    return { ok: false, status: 409, message: "Subscription already active" };
  }

  if (currentStatus === "pending" && ts?.mp_preapproval_id) {
    // evitamos crear 20 suscripciones por doble click
    return { ok: false, status: 409, message: "Subscription already pending confirmation" };
  }

  // 1) buscar plan en DB
  const [plan] = await db
    .select({
      plan_id: subscriptionPlanTable.plan_id,
      key: subscriptionPlanTable.key,
      mp_preapproval_plan_id: subscriptionPlanTable.mp_preapproval_plan_id,
      is_active: subscriptionPlanTable.is_active,
    })
    .from(subscriptionPlanTable)
    .where(eq(subscriptionPlanTable.key, planKey))
    .limit(1);

  if (!plan || !plan.is_active) {
    return { ok: false, status: 404, message: "Plan not found or inactive" };
  }

  if (!cardTokenId) {
    return { ok: false, status: 400, message: "cardTokenId is required" };
  }


  // 2) crear preapproval en MP
  const externalReference = `tenant:${tenantId}:plan:${plan.key}`;

  const mpBody = {
    preapproval_plan_id: plan.mp_preapproval_plan_id,
    payer_email: payerEmail,
    reason: "Zuma+ Pro",
    external_reference: externalReference,
    back_url: backUrl,
    card_token_id: cardTokenId, 
    redirect_url: backUrl,
    return_url: backUrl,
  };

  const me = await mpGetRaw<MpMe>("/users/me");

  console.log(
    "[MP][ME]",
    me.json.id,
    me.json.site_id,
    me.json.email
  );
  const planInfo = await mpGetRaw<MpPreapprovalPlan>(
  `/preapproval_plan/${plan.mp_preapproval_plan_id}`
);  

  console.log(
    "[MP][PLAN]",
    planInfo.json.id,
    planInfo.json.collector_id,
    planInfo.json.site_id,
    planInfo.json.auto_recurring?.currency_id
  );

  let mp: MpPreapprovalCreateResp;
  try {
    mp = await mpPost<MpPreapprovalCreateResp>("/preapproval", mpBody);
  } catch (e: any) {
    console.error("[MP] create preapproval failed", {
      message: e?.message,
      name: e?.name,
      cause: e?.cause,
      // OJO: no loguees tokens
      mpBody: {
        preapproval_plan_id: mpBody.preapproval_plan_id,
        payer_email: mpBody.payer_email,
        back_url: mpBody.back_url,
        external_reference: mpBody.external_reference,
        reason: mpBody.reason,
      },
    });

    return { ok: false, status: 502, message: e?.message ?? "MP error" };
  }

  const initPoint = mp.init_point;
  if (!initPoint) {
    return { ok: false, status: 502, message: "MP did not return init_point" };
  }

  // 3) pending mientras esperamos webhook
  await db
    .update(tenantSettingsTable)
    .set({
      subscription_status: "pending" as any,
      subscription_plan_id: plan.plan_id,
      mp_preapproval_id: mp.id,
      last_mp_event_at: new Date(),
    })
    .where(eq(tenantSettingsTable.tenant_id, tenantId));

  return {
    ok: true,
    status: 200,
    init_point: initPoint,
    preapproval_id: mp.id,
    subscription_status: "pending",
  };
}