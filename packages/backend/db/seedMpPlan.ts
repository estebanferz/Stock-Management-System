// scripts/seedMpPlans.ts
import { db } from "@server/db/db";
import { subscriptionPlanTable } from "@server/db/schema";
import { eq } from "drizzle-orm";



const MP_ACCESS_TOKEN = Bun.env.MP_ACCESS_TOKEN;
if (!MP_ACCESS_TOKEN) throw new Error("Missing MP_ACCESS_TOKEN");

type MpCreatePlanRes = { id: string };

async function mpCreatePlan(body: any): Promise<MpCreatePlanRes> {
  const r = await fetch("https://api.mercadopago.com/preapproval_plan", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(`MP create plan failed (${r.status}): ${JSON.stringify(json)}`);
  }
  return json as MpCreatePlanRes;
}

async function main() {
  const key = "zuma_pro";
  const name = "Zuma+ Pro";
  const price_amount = "45000.00";
  const currency = "ARS";

  const existing = await db
    .select({
      plan_id: subscriptionPlanTable.plan_id,
      mp_preapproval_plan_id: subscriptionPlanTable.mp_preapproval_plan_id,
    })
    .from(subscriptionPlanTable)
    .where(eq(subscriptionPlanTable.key, key))
    .limit(1);

  let planId: number;

  if (!existing.length) {
    const inserted = await db
      .insert(subscriptionPlanTable)
      .values({
        key,
        name,
        price_amount,
        currency,
        // lo completamos después
        mp_preapproval_plan_id: "PENDING",
        is_active: true,
      })
      .returning({ plan_id: subscriptionPlanTable.plan_id });

    planId = inserted[0]!.plan_id;
  } else {
    planId = existing[0]!.plan_id;

    // si ya tiene MP plan id “real”, no hacemos nada
    const mpId = existing[0]!.mp_preapproval_plan_id;
    if (mpId && mpId !== "PENDING") {
      console.log("Plan already linked to MP:", mpId);
      return;
    }
  }

  // 2) Crear plan en MP (preapproval_plan)
  // Campos típicos: reason, auto_recurring{frequency, frequency_type, transaction_amount, currency_id}, back_url, status
  // (MP define estos endpoints en su doc de suscripciones con plan asociado)
  const mpPayload = {
    reason: name,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: Number(price_amount),
      currency_id: currency,
    },
    back_url: "https://zumaplus.com.ar/dashboard/billing",
    status: "active",
  };

  const raw = process.env.APP_BILLING_RETURN_URL ?? "https://zumaplus.com.ar/dashboard/billing";
console.log("back_url raw:", JSON.stringify(raw));

const back_url = raw.trim();
new URL(back_url);

console.log("back_url final:", back_url);
console.log("mpPayload:", JSON.stringify({ ...mpPayload, back_url }, null, 2));


  const mp = await mpCreatePlan(mpPayload);

  // 3) Guardar ID en DB
  await db
    .update(subscriptionPlanTable)
    .set({ mp_preapproval_plan_id: mp.id })
    .where(eq(subscriptionPlanTable.plan_id, planId));

  console.log("✅ Created & linked MP plan:", { planId, mp_preapproval_plan_id: mp.id });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
