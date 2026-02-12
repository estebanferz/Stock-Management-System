import { and, eq } from "drizzle-orm";
import { db } from "@server/db/db";
import {
  tenantTable,
  tenantSettingsTable,
  sessionTable,
  tenantMembershipTable,
} from "@server/db/schema";
import type { TenantRole } from "../util/protectedController";
import { presignPut, presignGet } from "../lib/s3";
import { sql } from "drizzle-orm";

function assertOwnerOrAdmin(role: TenantRole) {
  if (role !== "owner" && role !== "admin") {
    throw new Error("FORBIDDEN");
  }
}
function assertOwner(role: TenantRole) {
  if (role !== "owner") {
    throw new Error("FORBIDDEN");
  }
}

export async function getCurrentTenant(tenantId: number) {
  const [tenant] = await db
    .select({
      tenant_id: tenantTable.tenant_id,
      name: tenantTable.name,
      is_active: tenantTable.is_active,
      created_at: tenantTable.created_at,
      updated_at: tenantTable.updated_at,
    })
    .from(tenantTable)
    .where(eq(tenantTable.tenant_id, tenantId));

  if (!tenant) return null;

  const [settings] = await db
    .select()
    .from(tenantSettingsTable)
    .where(eq(tenantSettingsTable.tenant_id, tenantId));

  return {
    tenant,
    tenantSettings: settings ?? null,
  };
}

export type TenantSettingsUpsert = Partial<{
  business_name: string | null;
  logo_key: string | null;
  logo_mime: string | null;
  cuit: string | null;
  address: string | null;
  display_currency: string;
  timezone: string;
  low_stock_threshold_default: number;
}>;

export async function upsertTenantSettings(
  tenantId: number,
  roleInTenant: TenantRole,
  patch: TenantSettingsUpsert
) {
  assertOwnerOrAdmin(roleInTenant);

  const now = new Date();

  const [row] = await db
    .insert(tenantSettingsTable)
    .values({
      tenant_id: tenantId,
      ...patch,
      updated_at: now,
    })
    .onConflictDoUpdate({
      target: tenantSettingsTable.tenant_id,
      set: { ...patch, updated_at: now },
    })
    .returning();

  return row;
}

export async function updateTenantName(tenantId: number, roleInTenant: TenantRole, name: string) {
  assertOwnerOrAdmin(roleInTenant);

  const [row] = await db
    .update(tenantTable)
    .set({ name, updated_at: new Date() })
    .where(eq(tenantTable.tenant_id, tenantId))
    .returning({ tenant_id: tenantTable.tenant_id, name: tenantTable.name });

  return row ?? null;
}

export async function deactivateTenant(tenantId: number, roleInTenant: TenantRole) {
  assertOwner(roleInTenant);

  const [row] = await db
    .update(tenantTable)
    .set({ is_active: false, updated_at: new Date() })
    .where(eq(tenantTable.tenant_id, tenantId))
    .returning({ tenant_id: tenantTable.tenant_id });

  // revoca todas las sesiones del tenant
  await db
    .update(sessionTable)
    .set({ revoked_at: new Date() })
    .where(eq(sessionTable.tenant_id, tenantId));

  return Boolean(row);
}

function pickDefined<T extends Record<string, any>>(obj: T) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out as Partial<T>;
}

async function assertCanEditTenant(tenantId: number, userId: number) {
  const [m] = await db
    .select({ is_active: tenantMembershipTable.is_active, role: tenantMembershipTable.role })
    .from(tenantMembershipTable)
    .where(and(eq(tenantMembershipTable.tenant_id, tenantId), eq(tenantMembershipTable.user_id, userId)));

  if (!m || !m.is_active) throw new Error("Membership inválida o inactiva.");
  if (m.role !== "owner" && m.role !== "admin") throw new Error("No autorizado.");
  return m;
}

export async function patchMyTenant(tenantId: number, userId: number, patch: { name?: string }) {
  await assertCanEditTenant(tenantId, userId);
  const defined = pickDefined(patch);
  if (!Object.keys(defined).length) {
    const [t] = await db.select().from(tenantTable).where(eq(tenantTable.tenant_id, tenantId));
    return t ?? null;
  }

  const [row] = await db
    .update(tenantTable)
    .set({ ...defined, updated_at: new Date() })
    .where(eq(tenantTable.tenant_id, tenantId))
    .returning();

  return row;
}

export async function patchMyTenantSettings(
  tenantId: number,
  userId: number,
  patch: Partial<{
    business_name: string | null;
    logo_key: string | null;
    logo_mime: string | null;
    cuit: string | null;
    address: string | null;
    display_currency: string;
    timezone: string;
    low_stock_threshold_default: number;
  }>
) {
  await assertCanEditTenant(tenantId, userId);

  const now = new Date();
  const defined = pickDefined(patch);

  if (!Object.keys(defined).length) {
    const [s] = await db.select().from(tenantSettingsTable).where(eq(tenantSettingsTable.tenant_id, tenantId));
    return s ?? null;
  }

  const [row] = await db
    .insert(tenantSettingsTable)
    .values({ tenant_id: tenantId, ...defined, updated_at: now })
    .onConflictDoUpdate({
      target: tenantSettingsTable.tenant_id,
      set: { ...defined, updated_at: now },
    })
    .returning();

  return row;
}

const LOGO_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const LOGO_MAX_SIZE = 5 * 1024 * 1024;

function isAllowedLogoType(v: string): v is (typeof LOGO_ALLOWED_TYPES)[number] {
  return (LOGO_ALLOWED_TYPES as readonly string[]).includes(v);
}

function makeLogoKey(tenantId: number, filename: string) {
  const ext = (filename.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const ts = Date.now();
  const rand = crypto.randomUUID();
  return `tenants/${tenantId}/logo/${ts}-${rand}.${ext}`;
}

export async function presignTenantLogoUpload(
  tenantId: number,
  roleInTenant: TenantRole,
  input: { contentType: string; filename: string; size: number }
): Promise<{ ok: true; key: string; putUrl: string } | { ok: false; status: number; message: string }> {
  assertOwnerOrAdmin(roleInTenant);

  if (!isAllowedLogoType(input.contentType)) {
    return { ok: false, status: 400, message: "INVALID_LOGO_TYPE" };
  }
  if (input.size > LOGO_MAX_SIZE) {
    return { ok: false, status: 400, message: "LOGO_TOO_LARGE" };
  }

  const key = makeLogoKey(tenantId, input.filename);
  const putUrl = await presignPut({ key, contentType: input.contentType, expiresInSec: 60 * 5 });
  return { ok: true, key, putUrl };
}

export async function linkTenantLogo(
  tenantId: number,
  roleInTenant: TenantRole,
  input: { key: string; contentType: string }
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  assertOwnerOrAdmin(roleInTenant);

  if (!isAllowedLogoType(input.contentType)) {
    return { ok: false, status: 400, message: "INVALID_LOGO_TYPE" };
  }

  const now = new Date();

  await db
    .insert(tenantSettingsTable)
    .values({
      tenant_id: tenantId,
      logo_key: input.key,
      logo_mime: input.contentType,
      logo_updated_at: now,
      updated_at: now,
    })
    .onConflictDoUpdate({
      target: tenantSettingsTable.tenant_id,
      set: {
        logo_key: input.key,
        logo_mime: input.contentType,
        logo_updated_at: now,
        updated_at: now,
      },
    });

  return { ok: true };
}

export async function getTenantLogoSignedUrl(tenantId: number) {
  const [s] = await db
    .select({
      logo_key: tenantSettingsTable.logo_key,
      logo_mime: tenantSettingsTable.logo_mime,
    })
    .from(tenantSettingsTable)
    .where(eq(tenantSettingsTable.tenant_id, tenantId))
    .limit(1);

  if (!s?.logo_key) return null;

  // inline, con filename fijo (si querés)
  const disposition = `inline; filename="logo"`;

  return presignGet({
    key: s.logo_key,
    expiresInSec: 60 * 10,
    responseContentDisposition: disposition,
  });
}
