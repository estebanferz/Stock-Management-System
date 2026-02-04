import crypto from "crypto";

export type MpWebhookParsed = {
  topic: string;        // e.g. "preapproval" / "subscription_preapproval" / "payment"
  resourceId: string;   // e.g. preapproval id
  rawEventId: string;   // best-effort unique event id
  xRequestId?: string | null;
  xSignature?: string | null;
};

function safeStr(x: unknown) {
  return typeof x === "string" && x.length ? x : undefined;
}

/**
 * MP puede mandar:
 * - JSON: { type/topic, data: { id }, id, resource }
 * - Query: ?topic=payment&data.id=123  (a veces)
 */
export function parseMpWebhook(ctx: any): MpWebhookParsed | null {
  const body = (ctx.body ?? {}) as any;
  const q = (ctx.query ?? {}) as any;

  const topic =
    safeStr(body?.topic) ??
    safeStr(body?.type) ??
    safeStr(q?.topic) ??
    safeStr(q?.type) ??
    "unknown";

  // data.id puede venir como "data.id" en query o anidado en body
  const resourceId =
    safeStr(body?.data?.id) ??
    safeStr(body?.id) ??
    safeStr(q?.["data.id"]) ??
    safeStr(q?.id) ??
    // a veces viene "resource" tipo URL; si la ves, podés parsear el ID al final
    (safeStr(body?.resource)?.split("/").pop() || undefined) ??
    "unknown";

  const xRequestId = ctx.request?.headers?.get?.("x-request-id") ?? null;
  const xSignature = ctx.request?.headers?.get?.("x-signature") ?? null;

  // rawEventId: si MP manda id de evento úsalo, si no, uno estable basado en headers + topic + resourceId
  const rawEventId =
    safeStr(body?.id) ??
    (xRequestId ? `${xRequestId}:${topic}:${resourceId}` : `${topic}:${resourceId}`);

  return {
    topic,
    resourceId,
    rawEventId,
    xRequestId,
    xSignature,
  };
}

/**
 * Validación opcional tipo MP (best-effort).
 * En varios ejemplos oficiales/no-oficiales se arma un "manifest" con:
 *  id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 * y se calcula HMAC-SHA256 con el secret, comparando con v1 del header.
 * :contentReference[oaicite:2]{index=2}
 */
export function verifyMpSignatureOrThrow(parsed: MpWebhookParsed, secret?: string | null) {
  if (!secret) return; // no validamos si no hay secret configurado

  const sig = parsed.xSignature;
  const reqId = parsed.xRequestId;

  if (!sig || !reqId) {
    throw new Error("Missing x-signature or x-request-id");
  }

  // x-signature suele venir tipo: "ts=170...,v1=abcdef..."
  const parts = sig.split(",").map((p) => p.trim());
  const ts = parts.find((p) => p.startsWith("ts="))?.slice(3);
  const v1 = parts.find((p) => p.startsWith("v1="))?.slice(3);

  if (!ts || !v1) throw new Error("Invalid x-signature format");

  const manifest = `id:${parsed.resourceId};request-id:${reqId};ts:${ts};`;
  const computed = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  // timing-safe compare
  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(v1, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error("Invalid signature");
  }
}

/** Genera un id estable y corto para usar como PK si querés */
export function makeEventId(parsed: MpWebhookParsed) {
  const base = `${parsed.rawEventId}`;
  return crypto.createHash("sha256").update(base).digest("hex");
}
