import { and, eq } from "drizzle-orm";
import { db } from "@server/db/db";
import {
  userTable,
  tenantMembershipTable,
  sessionTable,
  userSettingsTable,
} from "@server/db/schema";

async function assertActiveMembership(tenantId: number, userId: number) {
  const [m] = await db
    .select({
      is_active: tenantMembershipTable.is_active,
      role: tenantMembershipTable.role,
    })
    .from(tenantMembershipTable)
    .where(
      and(
        eq(tenantMembershipTable.tenant_id, tenantId),
        eq(tenantMembershipTable.user_id, userId)
      )
    );

  if (!m || !m.is_active) throw new Error("Membership inválida o inactiva.");
  return m;
}

function pickDefined<T extends Record<string, any>>(obj: T) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out as Partial<T>;
}

// ====== READ ======
export async function getMyUser(tenantId: number, userId: number) {
  const membership = await assertActiveMembership(tenantId, userId);

  const [user] = await db
    .select({
      user_id: userTable.user_id,
      email: userTable.email,
      role: userTable.role,
      is_active: userTable.is_active,
      created_at: userTable.created_at,
      last_login: userTable.last_login,
    })
    .from(userTable)
    .where(eq(userTable.user_id, userId));

  if (!user) return null;

  const [settings] = await db
    .select()
    .from(userSettingsTable)
    .where(eq(userSettingsTable.user_id, userId));

  return {
    user,
    userSettings: settings ?? null,
    roleInTenant: membership.role,
    tenant_id: tenantId,
  };
}

export type UserSettingsPatch = Partial<{
  display_name: string | null;
  phone: string | null;
  email_notifications: boolean;
}>;

// ====== UPDATE (PATCH semantics) ======
export async function patchMyUserSettings(
  tenantId: number,
  userId: number,
  patch: UserSettingsPatch
) {
  await assertActiveMembership(tenantId, userId);

  const now = new Date();
  const defined = pickDefined(patch);

  // Si no mandan nada, devolvé el row actual (evita writes vacíos)
  if (Object.keys(defined).length === 0) {
    const [existing] = await db
      .select()
      .from(userSettingsTable)
      .where(eq(userSettingsTable.user_id, userId));
    return existing ?? null;
  }

  const [row] = await db
    .insert(userSettingsTable)
    .values({
      user_id: userId,
      ...defined,
      updated_at: now,
    })
    .onConflictDoUpdate({
      target: userSettingsTable.user_id,
      set: { ...defined, updated_at: now },
    })
    .returning();

  return row;
}

// ====== REPLACE (PUT semantics) ======
export async function replaceMyUserSettings(
  tenantId: number,
  userId: number,
  input: {
    display_name: string | null;
    phone: string | null;
    email_notifications: boolean;
  }
) {
  await assertActiveMembership(tenantId, userId);

  const now = new Date();

  const [row] = await db
    .insert(userSettingsTable)
    .values({
      user_id: userId,
      ...input,
      updated_at: now,
    })
    .onConflictDoUpdate({
      target: userSettingsTable.user_id,
      set: { ...input, updated_at: now },
    })
    .returning();

  return row;
}

// ====== DELETE / RESET settings ======
export async function resetMyUserSettings(tenantId: number, userId: number) {
  await assertActiveMembership(tenantId, userId);

  const [row] = await db
    .delete(userSettingsTable)
    .where(eq(userSettingsTable.user_id, userId))
    .returning();

  return row ?? null; // te devuelve lo que borró (o null si no existía)
}

// ====== (lo tuyo) deactivate user ======
export async function deactivateMyUser(tenantId: number, userId: number) {
  await assertActiveMembership(tenantId, userId);

  const [u] = await db
    .update(userTable)
    .set({ is_active: false })
    .where(eq(userTable.user_id, userId))
    .returning({ user_id: userTable.user_id });

  await db
    .update(sessionTable)
    .set({ revoked_at: new Date() })
    .where(and(eq(sessionTable.user_id, userId), eq(sessionTable.tenant_id, tenantId)));

  return Boolean(u);
}
