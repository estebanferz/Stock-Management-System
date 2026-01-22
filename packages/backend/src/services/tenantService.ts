import { and, eq } from "drizzle-orm";
import { db } from "@server/db/db"; // ajustá si tu import es distinto
import {
  tenantTable,
  tenantSettingsTable,
  sessionTable,
  tenantMembershipTable,
} from "@server/db/schema";
import type { TenantRole } from "../util/protectedController";

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
  logo_url: string | null;
  cuit: string | null;
  address: string | null;
  default_currency: string;
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
    logo_url: string | null;
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
